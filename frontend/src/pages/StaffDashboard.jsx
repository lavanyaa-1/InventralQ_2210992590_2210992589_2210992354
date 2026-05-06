import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StaffDashboard = () => {
    const { token, user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [saleMsg, setSaleMsg] = useState('');

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(res.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [token]);

    const handleCreateSale = async (e) => {
        e.preventDefault();
        setSaleMsg('');
        try {
            await axios.post('http://localhost:5000/api/sales', {
                product: selectedProduct,
                quantity: Number(quantity)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSaleMsg('Sale created successfully!');
            setSelectedProduct(null);
            setQuantity(1);
            fetchProducts(); // Refresh stock
        } catch (error) {
            setSaleMsg(error.response?.data?.message || 'Error creating sale');
        }
    };

    if (loading) return <div>Loading Dashboard...</div>;

    return (
        <div className="dashboard-container">
            <h1 style={{ textTransform: 'capitalize' }}>{user?.role || 'Staff'} Sales Terminal</h1>
            
            <div className="section-container">
                <h2>Make a Sale</h2>
                {saleMsg && <div className={saleMsg.includes('successfully') ? 'alert-success' : 'alert-danger'}>{saleMsg}</div>}
                
                <form onSubmit={handleCreateSale} className="sale-form">
                    <div className="form-group">
                        <label>Select Product</label>
                        <select 
                            value={selectedProduct || ''} 
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            required
                        >
                            <option value="" disabled>-- Select a product --</option>
                            {products.filter(p => p.current_stock > 0).map(p => (
                                <option key={p._id} value={p._id}>
                                    {p.product_name} - ${p.price} (Stock: {p.current_stock})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Quantity</label>
                        <input 
                            type="number" 
                            min="1" 
                            value={quantity} 
                            onChange={(e) => setQuantity(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={!selectedProduct}>Create Sale</button>
                </form>
            </div>

            <div className="section-container">
                <h2>Product Catalog</h2>
                <div className="card-grid">
                    {products.map(p => (
                        <div key={p._id} className="card">
                            <h3>{p.product_name}</h3>
                            <p><strong>Price:</strong> ${p.price}</p>
                            <p><strong>Stock:</strong> {p.current_stock > 0 ? p.current_stock : <span className="text-danger">Out of Stock</span>}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
