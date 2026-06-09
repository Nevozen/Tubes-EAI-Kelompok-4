import os
import sys
import json
import time
import pika
from pathlib import Path

# Masukkan root directory crm-api ke sys.path agar import modul 'app' berjalan lancar
root_path = Path(__file__).resolve().parent.parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

from app.config import settings
from app.database import SessionLocal, engine, Base
from app.models import PurchaseHistory


def callback(ch, method, properties, body):
    """Callback function ketika menerima pesan dari RabbitMQ."""
    db = None
    try:
        # Dekode payload JSON
        payload = json.loads(body.decode("utf-8"))
        print(f"[*] Menerima pesan: {payload}")

        event_data = payload.get("data", {})
        order_id = event_data.get("order_id")
        customer_name = event_data.get("customer_name")
        # Gunakan customer_email sebagai fallback jika customer_id kosong
        customer_id = event_data.get("customer_id") or event_data.get("customer_email")
        total_price = event_data.get("total_amount") or event_data.get("total_price") or 0.0

        if not order_id or not customer_name:
            print(f"[-] Data order tidak lengkap atau tidak valid. Dilewati: {payload}")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        # Hubungkan ke database
        db = SessionLocal()

        # Cek duplikasi untuk memastikan idempotency
        existing = db.query(PurchaseHistory).filter(PurchaseHistory.order_id == order_id).first()
        if existing:
            print(f"[!] Riwayat pembelian untuk Order #{order_id} sudah terdaftar. Dilewati.")
        else:
            # Buat record baru
            purchase = PurchaseHistory(
                order_id=order_id,
                customer_id=str(customer_id) if customer_id else None,
                customer_name=customer_name,
                total_price=float(total_price)
            )
            db.add(purchase)
            db.commit()
            print(f"[+] Berhasil mencatat riwayat pembelian Order #{order_id} untuk {customer_name}")

        # Kirim acknowledgment agar pesan terhapus dari queue
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except json.JSONDecodeError:
        print(f"[-] Gagal dekode payload JSON: {body}")
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"[-] Gagal memproses pesan: {e}")
        # Masukkan kembali pesan ke queue jika terjadi error tak terduga (misal DB mati sementara)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    finally:
        if db:
            db.close()


def start_consumer():
    """Fungsi utama untuk menjalankan RabbitMQ consumer."""
    # Pastikan tabel database sudah terbentuk
    Base.metadata.create_all(bind=engine)

    # Kredensial koneksi RabbitMQ
    credentials = pika.PlainCredentials(settings.RABBITMQ_USER, settings.RABBITMQ_PASSWORD)
    parameters = pika.ConnectionParameters(
        host=settings.RABBITMQ_HOST,
        credentials=credentials,
        heartbeat=600,
        blocked_connection_timeout=300
    )

    print("[*] Menghubungkan ke RabbitMQ...")
    
    # Loop dengan retry jika koneksi RabbitMQ sempat gagal/terputus
    while True:
        try:
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()

            # Deklarasikan exchange dengan tipe fanout (sama dengan Order API)
            channel.exchange_declare(
                exchange=settings.RABBITMQ_EXCHANGE,
                exchange_type="fanout",
                durable=True
            )

            # Deklarasikan queue
            channel.queue_declare(queue=settings.RABBITMQ_QUEUE, durable=True)

            # Bind queue ke exchange agar menerima pesan
            channel.queue_bind(
                exchange=settings.RABBITMQ_EXCHANGE,
                queue=settings.RABBITMQ_QUEUE,
                routing_key=""
            )

            # Batasi prefetch agar memproses 1 pesan sekali waktu
            channel.basic_qos(prefetch_count=1)

            # Mulai mendengarkan queue
            channel.basic_consume(
                queue=settings.RABBITMQ_QUEUE,
                on_message_callback=callback
            )

            print(f"[*] Berhasil mendengarkan queue '{settings.RABBITMQ_QUEUE}'. Tekan Ctrl+C untuk berhenti.")
            channel.start_consuming()

        except KeyboardInterrupt:
            print("\n[*] Consumer dihentikan oleh pengguna.")
            break
        except Exception as e:
            print(f"[-] Koneksi terputus atau gagal terhubung: {e}")
            print("[*] Mencoba menghubungkan kembali dalam 5 detik...")
            time.sleep(5)


if __name__ == "__main__":
    start_consumer()
