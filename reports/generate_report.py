#!/usr/bin/env python3
"""
Script principal para generar reportes Excel y PDF desde conversaciones de chat
"""
import sys
import json
import os
from ai_extractor import extract_info_from_chat, format_for_export
from excel_generator import generate_excel
from pdf_generator import generate_pdf

def main():
    try:
        # Leer datos del argumento
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No se proporcionaron datos"}))
            sys.exit(1)
        
        data_str = sys.argv[1]
        input_data = json.loads(data_str)
        
        messages = input_data.get('messages', [])
        excel_path = input_data.get('excelPath')
        pdf_path = input_data.get('pdfPath')
        format_type = input_data.get('format', 'both')
        
        # Extraer información con IA
        extracted_data = extract_info_from_chat(messages)
        
        if not extracted_data:
            print(json.dumps({"error": "No se pudo extraer información de la conversación"}))
            sys.exit(1)
        
        # Formatear para exportación
        formatted_data = format_for_export(extracted_data)
        
        if not formatted_data:
            print(json.dumps({"error": "Error al formatear datos"}))
            sys.exit(1)
        
        # Generar archivos según el formato solicitado
        generated_files = {}
        
        if format_type in ['excel', 'both']:
            generate_excel(formatted_data, excel_path)
            generated_files['excel'] = excel_path
        
        if format_type in ['pdf', 'both']:
            generate_pdf(formatted_data, pdf_path)
            generated_files['pdf'] = pdf_path
        
        # Retornar resultado
        result = {
            "success": True,
            "files": generated_files,
            "data": formatted_data
        }
        
        print(json.dumps(result))
        sys.exit(0)
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "type": type(e).__name__
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
