import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AiInsights = () => {
    const { token } = useAuth();
    const [insightsData, setInsightsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/insights/demand', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setInsightsData(res.data.data);
                }
            } catch (err) {
                console.error('Error fetching AI insights:', err);
                setError('Failed to load AI Insights from analytics engine.');
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [token]);

    if (loading) return <div>Loading Analytics...</div>;

    if (error) return (
        <div className="dashboard-container">
            <h1>Advanced Analytics & Demand Prediction</h1>
            <div className="error-msg">{error}</div>
        </div>
    );

    if (!insightsData) return <div>No data available</div>;

    const { predictions, trending, lowPerforming, deadStock } = insightsData;

    return (
        <div className="dashboard-container">
            <h1>Advanced Analytics Insights</h1>
            <p style={{ color: 'var(--text-muted)' }}>Powered by InventralQ Node Analytics</p>

            <div className="section-container">
                <h2>Priority Restock Recommendations</h2>
                <div className="card-grid">
                    {predictions.filter(i => i.restock_required).length === 0 ? (
                        <p>No immediate restocks required based on current predictions.</p>
                    ) : (
                        predictions.filter(i => i.restock_required).map(insight => (
                            <div key={insight.product_id} className="card" style={{ borderColor: 'var(--danger-color)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)' }}>
                                <h3>{insight.product_name}</h3>
                                <p><strong>Current Stock:</strong> <span className="text-danger">{insight.current_stock}</span></p>
                                <p><strong>Predicted 30-Day Demand:</strong> {insight.predicted_demand_next_30_days} units</p>
                                <p><strong>Recommendation:</strong> Order {insight.recommended_order_quantity} units immediately</p>
                                <span className="badge-warning">URGENT RESTOCK</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {deadStock !== undefined && (
                <div className="section-container" style={{ borderLeft: '4px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                    <h2 style={{ color: '#ef4444', margin: '0 0 1rem 0' }}>⚠️ Dead Stock Warning</h2>
                    
                    {deadStock.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Awesome! The AI detects no completely stagnant stock in your warehouse.</p>
                    ) : (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>The AI has identified the following products as completely stagnant (0 recent sales and mathematically 0 predicted future demand). Action Recommended: Heavily discount these items immediately to free up warehouse capacity.</p>
                            </div>
                            <div className="card-grid">
                                {deadStock.map(item => (
                                    <div key={item.product_id} className="card" style={{ borderColor: '#ef4444', borderStyle: 'dashed' }}>
                                        <h3>{item.product_name}</h3>
                                        <p><strong>Unsold Inventory:</strong> <span className="text-danger">{item.current_stock} units</span></p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="card-grid" style={{ marginBottom: '2rem' }}>
                <div className="section-container" style={{ margin: 0 }}>
                    <h2>Trending Products</h2>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {trending.length > 0 ? trending.map((t, idx) => (
                            <li key={t.product_id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <strong>#{idx + 1} {t.product_name}</strong> - {t.sales_velocity} units sold
                            </li>
                        )) : <p>No sales data yet.</p>}
                    </ul>
                </div>
                <div className="section-container" style={{ margin: 0 }}>
                    <h2>Low-Performing Products</h2>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {lowPerforming.length > 0 ? lowPerforming.map((t, idx) => (
                            <li key={t.product_id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <strong>{t.product_name}</strong> - {t.sales_velocity} units sold (Needs attention)
                            </li>
                        )) : <p>No underperforming products.</p>}
                    </ul>
                </div>
            </div>

            <div className="section-container" style={{ marginTop: '2ex' }}>
                <h2>All Product Predictions</h2>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Stock</th>
                                <th>30-Day Demand</th>
                                <th>Status</th>
                                <th>AI Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.map(item => (
                                <tr key={item.product_id}>
                                    <td><strong>{item.product_name}</strong></td>
                                    <td>{item.current_stock}</td>
                                    <td>{item.predicted_demand_next_30_days}</td>
                                    <td>
                                        {item.restock_required ? 
                                            <span className="text-danger">Restock Needed</span> : 
                                            <span className="text-success">Sufficient</span>
                                        }
                                    </td>
                                    <td>{item.insight_message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AiInsights;
