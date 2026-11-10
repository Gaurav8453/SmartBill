<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartBill – GST Billing & Invoice Management System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
        }
        pre {
            background-color: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
        }
        code {
            font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 85%;
        }
        pre code {
            font-size: 100%;
        }
        a {
            color: #0366d6;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>

    <h1>SmartBill – GST Billing & Invoice Management System</h1>
    
    <p>SmartBill is a modern GST billing and invoice management application designed to simplify business billing operations. It provides an easy-to-use interface for managing customers, products, invoices, payments, and GST-related records.</p>
    
    <p>Built using Angular 20, SmartBill aims to provide a responsive, reliable, and user-friendly billing experience.</p>

    <h2>🚀 Features</h2>
    <ul>
        <li><strong>Dashboard:</strong> View important business information and billing summaries.</li>
        <li><strong>Customer Management:</strong> Add, update, view, and manage customer details.</li>
        <li><strong>Product Management:</strong> Maintain product information, pricing, and GST rates.</li>
        <li><strong>GST Invoice Generation:</strong> Create professional GST-compliant invoices.</li>
        <li><strong>Invoice Management:</strong> View, manage, and track generated invoices.</li>
        <li><strong>Payment Tracking:</strong> Maintain payment and outstanding balance records.</li>
        <li><strong>Reports:</strong> Access business and invoice-related reports.</li>
        <li><strong>Responsive Design:</strong> Access the application across desktop, tablet, and mobile devices.</li>
    </ul>

    <h2>🛠️ Technology Stack</h2>
    <table>
        <thead>
            <tr>
                <th>Component</th>
                <th>Technology</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Frontend</td>
                <td>Angular 20.3.5</td>
            </tr>
            <tr>
                <td>Backend</td>
                <td>ASP.NET Core Web API</td>
            </tr>
            <tr>
                <td>Database</td>
                <td>Microsoft SQL Server</td>
            </tr>
            <tr>
                <td>API Documentation</td>
                <td>Swagger</td>
            </tr>
            <tr>
                <td>Version Control</td>
                <td>Git & GitHub</td>
            </tr>
        </tbody>
    </table>

    <h2>📂 Project Structure</h2>
<pre><code>SmartBill/
├── src/
│   ├── app/
│   ├── assets/
│   ├── environments/
│   └── styles/
├── public/
├── angular.json
├── package.json
├── tsconfig.json
└── README.md</code></pre>

    <h2>💻 Getting Started</h2>
    
    <h3>Prerequisites</h3>
    <p>Make sure you have installed:</p>
    <ul>
        <li>Node.js</li>
        <li>npm</li>
        <li>Angular CLI 20</li>
        <li>Visual Studio Code</li>
    </ul>

    <h3>1. Clone the repository</h3>
<pre><code>git clone https://github.com/Gaurav8453/smartbill.git</code></pre>

    <h3>2. Navigate to the project directory</h3>
<pre><code>cd smartbill</code></pre>

    <h3>3. Install dependencies</h3>
<pre><code>npm install</code></pre>

    <h3>4. Start the development server</h3>
<pre><code>ng serve</code></pre>

    <h3>5. Open the application</h3>
    <p>Navigate to:</p>
<pre><code>http://localhost:4200/</code></pre>
    <p>The application automatically reloads whenever you modify the source files.</p>

    <h2>🏗️ Build for Production</h2>
    <p>Run:</p>
<pre><code>ng build</code></pre>
    <p>The optimized production build will be generated inside the <code>dist/</code> directory.</p>

    <h2>🔗 Backend Integration</h2>
    <p>SmartBill uses an ASP.NET Core Web API to handle application business logic and database operations.</p>
    <p>The backend integrates with Microsoft SQL Server for storing and managing application data.</p>
    <p>Swagger is used for API documentation and testing.</p>

    <h2>🌐 Deployment</h2>
    <p>The planned hosting architecture is:</p>
    <ul>
        <li><strong>Frontend:</strong> Cloudflare Pages</li>
        <li><strong>Backend:</strong> Somee ASP.NET Hosting</li>
        <li><strong>Database:</strong> Somee Microsoft SQL Server</li>
    </ul>
    <p>The architecture is designed to support multiple Angular frontend applications connected to one shared backend API.</p>

    <h2>👨‍💻 Developer</h2>
    <p><strong>Gaurav8453</strong><br>
    GitHub: <a href="https://github.com/Gaurav8453" target="_blank">https://github.com/Gaurav8453</a></p>

    <h2>📄 License</h2>
    <p>This project is currently maintained as a private or personal development project. Add an appropriate open-source license if you decide to distribute it publicly.</p>

    <hr>
    <p><em>SmartBill – Simplifying GST Billing and Business Management.</em></p>

</body>
</html>
