import pandas as pd
import os

file_path = r"d:\postulation\Aslikh Hamza ¬ Dashboard Individuel de suivi TRE.xlsx"

def analyze_excel(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print(f"Analyzing: {file_path}")
    
    with open("backend/analysis_output_utf8.txt", "w", encoding="utf-8") as f:
        try:
            xls = pd.ExcelFile(file_path)
            f.write(f"Sheet names: {xls.sheet_names}\n")
            
            for sheet_name in xls.sheet_names:
                f.write(f"\n--- Sheet: {sheet_name} ---\n")
                try:
                    df = pd.read_excel(xls, sheet_name=sheet_name, nrows=5)
                    f.write("Columns:\n")
                    for col in df.columns:
                        f.write(f"  - {col} (Type: {df[col].dtype})\n")
                    f.write("First 5 rows:\n")
                    f.write(df.head().to_string())
                    f.write("\n")
                except Exception as e:
                    f.write(f"Error reading sheet {sheet_name}: {e}\n")
                    
        except Exception as e:
            f.write(f"Error opening file: {e}\n")

if __name__ == "__main__":
    analyze_excel(file_path)
