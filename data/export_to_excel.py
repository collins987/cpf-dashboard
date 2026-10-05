import os
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect

load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")

engine = create_engine(os.environ["DATABASE_URL"])
inspector = inspect(engine)
tables = inspector.get_table_names(schema="public")

out = Path(__file__).resolve().parent / "cpf_dashboard_export.xlsx"
with pd.ExcelWriter(out, engine="openpyxl") as writer:
    with engine.connect() as conn:
        for t in tables:
            pd.read_sql_table(t, conn, schema="public").to_excel(
                writer, sheet_name=t[:31], index=False
            )
print(f"Wrote {out}")
