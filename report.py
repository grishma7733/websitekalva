import pandas as pd
import dash
from dash import dcc, html
from dash.dependencies import Input, Output, State
from dash.dash_table import DataTable
import mysql.connector

# Connect to MySQL database
def connect_to_db():
    try:
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="SF2"
        )
        return db
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None

# Query the data
def query_data(db):
    query = "SELECT * FROM Atrain2"
    df = pd.read_sql(query, db)
    return df

# Update the database
def update_db(db, df):
    cursor = db.cursor()
    for index, row in df.iterrows():
        update_query = f"""
        UPDATE Atrain2 SET 
        POH_DATE = %s, 
        IC_DATE = %s, 
        TI_DATE = %s, 
        IA_DATE = %s, 
        WASHING_DATE = %s, 
        MOPPING_DATE = %s
        WHERE BEDTC = %s;
        """
        cursor.execute(update_query, (
            row['POH_date'], 
            row['IC_date'], 
            row['TI_date'], 
            row['IA_date'], 
            row['washing_date'], 
            row['mopping_date'], 
            row['BEDTC']
        ))
    db.commit()
    cursor.close()

# Create the dashboard
app = dash.Dash(__name__)

app.layout = html.Div(className='dashboard', children=[
    html.H1('KCS Dashboard'),
    dcc.Input(
        id='search-input',
        type='text',
        placeholder='Search by BEDTC number...',
        style={'margin-bottom': '20px', 'width': '100%'}
    ),
    html.Div(className='dash-table-container', children=[
        DataTable(
            id='table',
            page_size=12,  # Display 12 rows per page
            editable=True,  # Allow table cells to be edited
            style_table={'height': '100%', 'overflowY': 'auto'},
            style_cell={'textAlign': 'left'},
            style_header={
                'backgroundColor': '#0033cc',
                'color': 'white',
                'fontWeight': 'bold'
            },
            filter_action='native'
        )
    ]),
    html.Button('Save Changes', id='save-button', n_clicks=0, style={'margin-top': '20px', 'width': '100%'}),
    html.Div(id='save-status', style={'margin-top': '20px'})
])

@app.callback(
    Output('table', 'data'),
    Output('table', 'columns'),
    Input('search-input', 'value')
)
def update_table(search_value):
    db = connect_to_db()
    if db is None:
        return [], []
    df = query_data(db)
    if search_value:
        df = df[df['BEDTC'].astype(str).str.contains(search_value, case=False, na=False)]
    data = df.to_dict('records')
    columns = [{'name': col, 'id': col, 'type': 'datetime' if 'DATE' in col else 'text'} for col in df.columns]
    db.close()
    return data, columns

@app.callback(
    Output('save-status', 'children'),
    Input('save-button', 'n_clicks'),
    State('table', 'data')
)
def save_changes(n_clicks, rows):
    if n_clicks > 0:
        try:
            db = connect_to_db()
            if db is None:
                return 'Database connection failed'
            df = pd.DataFrame(rows)
            update_db(db, df)
            db.close()
            return 'Changes Saved'
        except Exception as e:
            return f'Error: {e}'
    return ''

if __name__ == '__main__':
    app.run_server(debug=True)
