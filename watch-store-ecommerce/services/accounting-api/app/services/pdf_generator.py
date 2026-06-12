from __future__ import annotations

from datetime import datetime
from fpdf import FPDF


def build_invoice_pdf(invoice) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_margin(15)
    
    # 1. Header (Logo & Title)
    pdf.set_font("helvetica", "B", 22)
    pdf.cell(100, 12, "DECADE.", ln=0)
    pdf.set_font("helvetica", "B", 14)
    pdf.set_text_color(148, 163, 184)  # Slate-400
    pdf.cell(80, 12, "INVOICE", ln=1, align="R")
    pdf.set_text_color(15, 23, 42)  # Slate-900
    pdf.ln(8)
    
    # 2. Billing & Invoice details columns
    pdf.set_font("helvetica", "B", 9)
    pdf.set_text_color(148, 163, 184)  # Slate-400
    pdf.cell(100, 5, "BILLED TO:", ln=0)
    pdf.cell(80, 5, "INVOICE DETAILS:", ln=1)
    
    pdf.set_font("helvetica", "", 10)
    pdf.set_text_color(15, 23, 42)  # Slate-900
    
    customer_name = invoice.customer_name or "Guest Customer"
    customer_email = invoice.customer_email or "No Email Provided"
    pdf.cell(100, 5, customer_name, ln=0)
    pdf.cell(80, 5, f"Invoice No: {invoice.invoice_number}", ln=1)
    
    pdf.cell(100, 5, f"Email: {customer_email}", ln=0)
    issued_date = invoice.issued_at.strftime("%d/%m/%Y") if invoice.issued_at else datetime.now().strftime("%d/%m/%Y")
    pdf.cell(80, 5, f"Date: {issued_date}", ln=1)
    
    pdf.cell(100, 5, f"Order ID: #{invoice.order_id}", ln=0)
    pdf.cell(80, 5, "Payment Method: Paid Online (E-Commerce)", ln=1)
    
    pdf.ln(12)
    
    # 3. Table Headers
    pdf.set_font("helvetica", "B", 10)
    pdf.set_fill_color(248, 250, 252)  # Slate-50 background
    pdf.set_text_color(71, 85, 105)  # Slate-600
    
    pdf.cell(90, 10, " Watch Item", border=1, ln=0, fill=True)
    pdf.cell(20, 10, "Qty", border=1, ln=0, align="C", fill=True)
    pdf.cell(35, 10, "Price", border=1, ln=0, align="R", fill=True)
    pdf.cell(35, 10, "Total", border=1, ln=1, align="R", fill=True)
    
    # 4. Table Items
    pdf.set_font("helvetica", "", 10)
    pdf.set_text_color(15, 23, 42)  # Slate-900
    
    for item in invoice.items:
        # Format currency nicely: e.g. Rp 12.450.000
        price_val = int(item.unit_price)
        total_val = int(item.line_total)
        price_str = f"Rp {price_val:,}".replace(",", ".")
        total_str = f"Rp {total_val:,}".replace(",", ".")
        
        pdf.cell(90, 9, f" {item.product_name}", border=1, ln=0)
        pdf.cell(20, 9, str(item.quantity), border=1, ln=0, align="C")
        pdf.cell(35, 9, price_str, border=1, ln=0, align="R")
        pdf.cell(35, 9, total_str, border=1, ln=1, align="R")
        
    # 5. Grand Total Row
    pdf.ln(6)
    pdf.set_font("helvetica", "B", 11)
    grand_total_val = int(invoice.grand_total)
    grand_total_str = f"Rp {grand_total_val:,}".replace(",", ".")
    
    pdf.cell(145, 10, "Total Amount Paid  ", ln=0, align="R")
    pdf.set_text_color(212, 175, 55)  # Gold highlight
    pdf.cell(35, 10, grand_total_str, ln=1, align="R")
    
    # 6. Footer note
    pdf.ln(25)
    pdf.set_font("helvetica", "I", 9)
    pdf.set_text_color(148, 163, 184)  # Slate-400
    pdf.cell(180, 5, "Thank you for shopping with Decade.", ln=1, align="C")
    pdf.cell(180, 5, "This computer-generated invoice is a valid proof of purchase.", ln=1, align="C")
    
    return pdf.output()
