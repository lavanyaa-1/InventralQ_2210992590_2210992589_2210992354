import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const { token, user } = useAuth();
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [activeTab, setActiveTab] = useState('inventory');
    const [loading, setLoading] = useState(true);
    const [productMsg, setProductMsg] = useState('');
    const [newProduct, setNewProduct] = useState({
        product_name: '', category: '', price: '', cost_price: '', current_stock: '', min_stock_level: '', supplier_name: ''
    });
    const [restockData, setRestockData] = useState({ productId: '', quantity: '' });
    const [restockMsg, setRestockMsg] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const prodRes = await axios.get('http://localhost:5000/api/products', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const salesRes = await axios.get('http://localhost:5000/api/sales', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                let fetchedStaff = [];
                if (user?.role === 'admin') {
                    try {
                        const staffRes = await axios.get('http://localhost:5000/api/auth/users', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        fetchedStaff = staffRes.data.data || [];
                    } catch (err) {
                        console.error('Error fetching staff list:', err);
                    }
                }
                
                setProducts(prodRes.data);
                setSales(salesRes.data.data);
                setStaffList(fetchedStaff);
            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setProductMsg('');
        try {
            await axios.post('http://localhost:5000/api/products', {
                ...newProduct,
                price: Number(newProduct.price),
                cost_price: Number(newProduct.cost_price),
                current_stock: Number(newProduct.current_stock),
                min_stock_level: Number(newProduct.min_stock_level)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProductMsg('Product added successfully!');
            setNewProduct({ product_name: '', category: '', price: '', cost_price: '', current_stock: '', min_stock_level: '', supplier_name: '' });
            
            // Refresh products silently
            const prodRes = await axios.get('http://localhost:5000/api/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(prodRes.data);
        } catch (error) {
            setProductMsg(error.response?.data?.message || 'Error adding product');
        }
    };

    const handleRestock = async (e) => {
        e.preventDefault();
        setRestockMsg('');
        if (!restockData.productId) {
            return setRestockMsg('Please select a product');
        }
        try {
            await axios.put(`http://localhost:5000/api/products/${restockData.productId}/restock`, {
                quantity: Number(restockData.quantity)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRestockMsg('Product restocked successfully!');
            setRestockData({ productId: '', quantity: '' });
            
            // Refresh products silently
            const prodRes = await axios.get('http://localhost:5000/api/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(prodRes.data);
        } catch (error) {
            setRestockMsg(error.response?.data?.message || 'Error restocking product');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone and will permanently remove it from inventory.")) return;
        try {
            await axios.delete(`http://localhost:5000/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(products.filter(p => p._id !== id));
            setProductMsg('Product deleted successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete product');
        }
    };

    const handleDeleteSale = async (id) => {
        if (!window.confirm("Are you sure you want to delete this sale?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/sales/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSales(sales.filter(s => s._id !== id));
            // also refresh products to update restored stock
            const prodRes = await axios.get('http://localhost:5000/api/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(prodRes.data);
        } catch (error) {
            alert('Failed to delete sale');
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm("Are you sure you want to delete this staff member?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/auth/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaffList(staffList.filter(s => s._id !== id));
        } catch (error) {
            alert('Failed to delete staff member');
        }
    };

    if (loading) return <div>Loading Dashboard...</div>;

    return (
        <div className="dashboard-container">
            <h1 style={{ textTransform: 'capitalize' }}>{user?.role || 'Admin'} Dashboard</h1>

            <div className="tabs-container">
                <button className={`tab-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Inventory Management</button>
                <button className={`tab-item ${activeTab === 'restock' ? 'active' : ''}`} onClick={() => setActiveTab('restock')}>Restock Inventory</button>
                {user?.role === 'admin' && (
                    <button className={`tab-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>Staff Controls</button>
                )}
                <button className={`tab-item ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>Sales Ledger</button>
            </div>

            {activeTab === 'inventory' && (
                <>
                    <div className="section-container">
                        <h2>Add New Product</h2>
                {productMsg && <div className={productMsg.includes('successfully') ? 'alert-success' : 'alert-danger'}>{productMsg}</div>}
                <form onSubmit={handleAddProduct} style={{ maxWidth: '800px' }}>
                    <div className="card-grid" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Product Name</label>
                            <input type="text" value={newProduct.product_name} onChange={e => setNewProduct({...newProduct, product_name: e.target.value})} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Category</label>
                            <input type="text" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Price ($)</label>
                            <input type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Cost Price ($)</label>
                            <input type="number" step="0.01" min="0" value={newProduct.cost_price} onChange={e => setNewProduct({...newProduct, cost_price: e.target.value})} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Current Stock</label>
                            <input type="number" min="0" value={newProduct.current_stock} onChange={e => setNewProduct({...newProduct, current_stock: e.target.value})} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Min Stock Level</label>
                            <input type="number" min="0" value={newProduct.min_stock_level} onChange={e => setNewProduct({...newProduct, min_stock_level: e.target.value})} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Supplier Name</label>
                            <input type="text" value={newProduct.supplier_name} onChange={e => setNewProduct({...newProduct, supplier_name: e.target.value})} required />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.8rem 2.5rem' }}>Add Product</button>
                </form>
            </div>
            
            <div className="section-container">
                <h2>Products Overview</h2>
                <div className="card-grid">
                    {products.map(p => (
                        <div key={p._id} className="card">
                            <h3>{p.product_name}</h3>
                            <p><strong>Category:</strong> {p.category}</p>
                            <p><strong>Price / Cost:</strong> ${p.price} / ${p.cost_price || 0}</p>
                            <p><strong>Stock:</strong> <span className={p.current_stock < p.min_stock_level ? 'text-danger' : 'text-success'}>{p.current_stock}</span></p>
                            {p.current_stock < p.min_stock_level && <span className="badge-warning" style={{ display: 'block', marginBottom: '0.5rem' }}>Low Stock</span>}
                            {user?.role === 'admin' && (
                                <button onClick={() => handleDeleteProduct(p._id)} className="btn-danger" style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem' }}>Delete</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            </>
            )}

            {activeTab === 'restock' && (
                <div className="section-container">
                    <h2>Restock Existing Product</h2>
                    {restockMsg && <div className={restockMsg.includes('successfully') ? 'alert-success' : 'alert-danger'}>{restockMsg}</div>}
                    <form onSubmit={handleRestock} style={{ maxWidth: '600px' }}>
                        <div className="card-grid" style={{ gap: '1rem', marginBottom: '1.5rem', gridTemplateColumns: '1fr' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Select Product</label>
                                <select 
                                    value={restockData.productId} 
                                    onChange={e => setRestockData({...restockData, productId: e.target.value})} 
                                    required
                                >
                                    <option value="" disabled>Choose a product...</option>
                                    {products.map(p => (
                                        <option key={p._id} value={p._id}>{p.product_name} (Current Stock: {p.current_stock})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Quantity Received</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    value={restockData.quantity} 
                                    onChange={e => setRestockData({...restockData, quantity: e.target.value})} 
                                    required 
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.8rem 2.5rem' }}>Process Restock</button>
                    </form>
                </div>
            )}

            {activeTab === 'staff' && user?.role === 'admin' && (
                <div className="section-container">
                    <h2>Staff Overview</h2>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffList.map(s => (
                                    <tr key={s._id}>
                                        <td>{s.name}</td>
                                        <td>{s.email}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{s.role}</td>
                                        <td>
                                            <button onClick={() => handleDeleteStaff(s._id)} className="btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'sales' && (
                <div className="section-container">
                    <h2>Recent Sales</h2>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Total Price</th>
                                <th>Sold By</th>
                                <th>Date</th>
                                {user?.role === 'admin' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(s => (
                                <tr key={s._id}>
                                    <td>{s.product?.product_name || 'N/A'}</td>
                                    <td>{s.quantity}</td>
                                    <td>${s.total_price}</td>
                                    <td>{s.sold_by?.name || 'N/A'}</td>
                                    <td>{new Date(s.sale_date).toLocaleString()}</td>
                                    {user?.role === 'admin' && (
                                        <td>
                                            <button onClick={() => handleDeleteSale(s._id)} className="btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Delete</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            )}
        </div>
    );
};

export default AdminDashboard;
