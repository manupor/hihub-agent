"""
PDF Generator - Genera reportes profesionales en PDF con branding de HiHub
"""
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def generate_pdf(data, output_path, logo_path=None):
    """
    Genera un PDF profesional con la información del cliente
    
    Args:
        data: Diccionario con información formateada
        output_path: Ruta donde guardar el archivo PDF
        logo_path: Ruta al logo de HiHub (opcional)
    
    Returns:
        str: Ruta del archivo generado
    """
    doc = SimpleDocTemplate(output_path, pagesize=letter,
                           rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)
    
    # Contenedor de elementos
    elements = []
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#F7941D'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1a1a2e'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Logo (si existe)
    if logo_path:
        try:
            logo = Image(logo_path, width=2*inch, height=0.6*inch)
            elements.append(logo)
            elements.append(Spacer(1, 12))
        except:
            pass
    
    # Título
    elements.append(Paragraph("REPORTE DE CLIENTE", title_style))
    elements.append(Paragraph(f"HiHub Global Technologies", styles['Normal']))
    elements.append(Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Información del Cliente
    elements.append(Paragraph("INFORMACIÓN DEL CLIENTE", heading_style))
    
    cliente_data = [
        ["Cliente:", data.get("cliente", "N/A")],
        ["Teléfono:", data.get("telefono", "N/A")],
        ["Empresa:", data.get("empresa", "N/A")],
        ["Estado:", data.get("estado", "Consulta Inicial")]
    ]
    
    cliente_table = Table(cliente_data, colWidths=[2*inch, 4*inch])
    cliente_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    
    elements.append(cliente_table)
    elements.append(Spacer(1, 20))
    
    # Productos/Servicios
    elements.append(Paragraph("PRODUCTOS/SERVICIOS", heading_style))
    
    productos_data = [
        ["Producto:", data.get("producto", "N/A")],
        ["Especificaciones:", data.get("especificaciones", "N/A")],
        ["Cantidad:", data.get("cantidad", "N/A")]
    ]
    
    productos_table = Table(productos_data, colWidths=[2*inch, 4*inch])
    productos_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP')
    ]))
    
    elements.append(productos_table)
    elements.append(Spacer(1, 20))
    
    # Transporte y Ubicación
    elements.append(Paragraph("DETALLES DE TRANSPORTE", heading_style))
    
    transporte_data = [
        ["Ubicación Cliente:", data.get("ubicacion_cliente", "N/A")],
        ["Ubicación Envío:", data.get("ubicacion_envio", "N/A")],
        ["Transporte:", data.get("transporte", "Por Definir")],
        ["Notas Transporte:", data.get("transporte_notas", "N/A")]
    ]
    
    transporte_table = Table(transporte_data, colWidths=[2*inch, 4*inch])
    transporte_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    
    elements.append(transporte_table)
    elements.append(Spacer(1, 20))
    
    # Detalles Comerciales
    elements.append(Paragraph("DETALLES COMERCIALES", heading_style))
    
    comercial_data = [
        ["Precio Estimado:", data.get("precio_estimado", "N/A")],
        ["Fecha Entrega:", data.get("fecha_entrega", "N/A")],
        ["Forma de Pago:", data.get("forma_pago", "N/A")]
    ]
    
    comercial_table = Table(comercial_data, colWidths=[2*inch, 4*inch])
    comercial_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    
    elements.append(comercial_table)
    elements.append(Spacer(1, 20))
    
    # Notas
    if data.get("notas"):
        elements.append(Paragraph("NOTAS Y PRÓXIMOS PASOS", heading_style))
        elements.append(Paragraph(data.get("notas", ""), styles['Normal']))
        elements.append(Spacer(1, 20))
    
    # Pie de página
    elements.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    elements.append(Paragraph("_______________________________________________", footer_style))
    elements.append(Paragraph("HiHub Global Technologies | hihubtrade@outlook.com | +86 18958020517", footer_style))
    elements.append(Paragraph("Este documento es confidencial y está destinado únicamente al cliente mencionado", footer_style))
    
    # Construir PDF
    doc.build(elements)
    return output_path
