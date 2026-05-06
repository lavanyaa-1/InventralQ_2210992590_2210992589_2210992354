const apiUrl = 'http://localhost:5000/api';

async function testFlow() {
    console.log('--- Starting API Tests ---');
    const uniqueEmail = `admin_${Date.now()}@test.com`;

    try {
        // 1. Register Admin
        console.log('\n[1] Registering Admin...');
        const registerRes = await fetch(`${apiUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Admin User',
                email: uniqueEmail,
                password: 'password123',
                role: 'admin'
            })
        });
        const adminData = await registerRes.json();
        console.log('Register Response:', registerRes.status, adminData.email || adminData.message);

        // If already exists, we might not get token from register. But we use unique email so it should be fine.
        // However, if the db is NOT empty, registration requires admin token.
        // First let's check if we succeeded.
        let adminToken = adminData.token;

        if (registerRes.status === 401 || registerRes.status === 403) {
            console.log('DB not empty, register failed. We need an existing admin token. For now, assuming first run or using test DB.');
        }

        if (!adminToken) {
            console.log('Skipping rest since we have no token');
            return;
        }

        // 2. Login Admin
        console.log('\n[2] Logging in Admin...');
        const loginRes = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: uniqueEmail,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Response:', loginRes.status, loginData.email ? 'Success' : loginData);

        let productId;

        // 3. Create Product
        console.log('\n[3] Creating Product...');
        const createRes = await fetch(`${apiUrl}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                product_name: 'Test Product',
                category: 'Electronics',
                price: 99.99,
                current_stock: 50,
                min_stock_level: 10,
                supplier_name: 'Tech Supplier Inc'
            })
        });
        const createdProduct = await createRes.json();
        console.log('Create Product Response:', createRes.status, createdProduct._id ? 'Success' : createdProduct);
        productId = createdProduct._id;

        // 4. Get Products
        console.log('\n[4] Getting Products...');
        const getRes = await fetch(`${apiUrl}/products`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const products = await getRes.json();
        console.log('Get Products Response:', getRes.status, products.length !== undefined ? `Got ${products.length} products` : products);

        if (productId) {
            // 5. Update Product
            console.log('\n[5] Updating Product...');
            const updateRes = await fetch(`${apiUrl}/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ price: 89.99 })
            });
            const updatedProduct = await updateRes.json();
            console.log('Update Product Response:', updateRes.status, updatedProduct.price === 89.99 ? 'Success' : updatedProduct);

            // 6. Delete Product
            console.log('\n[6] Deleting Product...');
            const deleteRes = await fetch(`${apiUrl}/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const deletedData = await deleteRes.json();
            console.log('Delete Product Response:', deleteRes.status, deletedData);
        }

        console.log('\n--- API Tests Finished ---');
    } catch (error) {
        console.error('Test Error:', error.message);
    }
}

testFlow();
