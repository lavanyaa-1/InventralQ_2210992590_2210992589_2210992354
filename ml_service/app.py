from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression


app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict_demand():
    """
    This endpoint expects a JSON payload containing exactly two things:
    1. 'products': A list of all your products (with their ID and stock levels).
    2. 'sales': A history of all sales made (with date, quantity, and product ID).
    """
    data = request.json
    products = data.get('products', [])
    sales = data.get('sales', [])
    
    # 1. Prepare to hold our final predictions
    predictions = []
    
    # 2. If there are no sales at all yet, we can't train a model. 
    # Return a basic default analysis for all products.
    if not sales:
        for p in products:
            predictions.append({
                "product_id": p['_id'],
                "predicted_demand_next_30_days": 0,
                "sales_velocity": 0,
                "model_confidence": 0.0
            })
        return jsonify({"success": True, "predictions": predictions})
        
    # 3. Load the MongoDB sales data into a Pandas DataFrame (a fancy table for Data Science)
    df = pd.DataFrame(sales)
    
    # Ensure the sale_date is actually understood as a timeline (DateTime)
    df['sale_date'] = pd.to_datetime(df['sale_date'])
    
    # Create a numerical column for dates so our Math model can understand time progression.
    # We calculate the "number of days" since the very first sale in the dataset.
    min_date = df['sale_date'].min()
    df['days_since_start'] = (df['sale_date'] - min_date).dt.days

    # 4. Analyze each product one by one
    for p in products:
        p_id = p['_id']
        
        # Filter the massive table to ONLY show sales for THIS specific product
        product_sales = df[df['product'] == p_id]
        
        # How many did we sell in total historically?
        total_velocity = int(product_sales['quantity'].sum()) if not product_sales.empty else 0
        
        # We need at least 2 DISTINCT days to mathematically trace a line.
        unique_days = product_sales['days_since_start'].nunique()
        
        if product_sales.empty or unique_days < 2:
            if product_sales.empty:
                predicted_demand = 0
            else:
                # Smart Fallback: Historical Daily Average (Total sales / Active Lifespan)
                local_min = product_sales['days_since_start'].min()
                local_max = product_sales['days_since_start'].max()
                active_days = max(1, local_max - local_min + 1)
                
                daily_avg = total_velocity / active_days
                predicted_demand = int(daily_avg * 30)

            predictions.append({
                "product_id": p_id,
                "predicted_demand_next_30_days": predicted_demand,
                "sales_velocity": total_velocity,
                "model_confidence": 0.4 if not product_sales.empty else 0.0 # Heuristic fallback tracking
            })
            continue
            
        # 5. MACHINE LEARNING PART
        # We group sales by the 'day' they happened. 
        daily_sales = product_sales.groupby('days_since_start')['quantity'].sum().reset_index()

        # --- FIX: ZERO-FILLING OPTIMISM BIAS ---
        # Inject artificial '0' sales records for days where no one bought anything.
        min_day = daily_sales['days_since_start'].min()
        max_day = daily_sales['days_since_start'].max()
        
        all_days = pd.DataFrame({'days_since_start': np.arange(min_day, max_day + 1)})
        daily_sales = pd.merge(all_days, daily_sales, on='days_since_start', how='left').fillna({'quantity': 0})
        
        # X is our Timeline (Days) -> Independent Variable
        # y is our Sales Volume (Quantity) -> Dependent Variable
        X = daily_sales[['days_since_start']].values
        y = daily_sales['quantity'].values
        
        # We create a Linear Regression model and train it
        model = LinearRegression()
        model.fit(X, y)
        
        # --- FIX: GENUINE MATH CONFIDENCE ---
        # Calculate the R-squared accuracy score of the trend line.
        try:
            r_squared = model.score(X, y)
            # Cap the score between 10% and 99% to keep it realistically grounded
            confidence_score = round(max(0.1, min(r_squared, 0.99)), 2)
        except Exception:
            confidence_score = 0.5
        
        # Now we ask the AI: What will happen over the NEXT 30 days?
        # We find what the last recorded day was...
        last_recorded_day = daily_sales['days_since_start'].max()
        
        # ...and create a fake timeline representing tomorrow until 30 days from now.
        future_days = np.array([[last_recorded_day + i] for i in range(1, 31)])
        
        # We pass this fake timeline into the model and ask it to predict the sales!
        future_predictions = model.predict(future_days)
        
        # Regression lines can sometimes dip below zero if trending down too hard.
        # We cannot have negative sales on any given day, so we clip all negative daily predictions to 0.
        future_predictions = np.maximum(0, future_predictions)
        
        # We sum all those 30 days together to get the total monthly demand
        predicted_30_days = int(np.sum(future_predictions))
        
        predictions.append({
            "product_id": p_id,
            "predicted_demand_next_30_days": predicted_30_days,
            "sales_velocity": total_velocity,
            "model_confidence": confidence_score
        })

    return jsonify({
        "success": True,
        "predictions": predictions
    })

if __name__ == '__main__':
    # Run the server on port 8000
    app.run(port=8000, debug=True)
