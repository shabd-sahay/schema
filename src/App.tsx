import React, { useState } from 'react';
import { Layout, Typography, Button } from 'antd';
import SchemaBuilder from './SchemaBuilder';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [showSaved, setShowSaved] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1677ff' }}>
        <Typography.Title style={{ color: 'white', margin: 0 }} level={3}>
          JSON Schema Builder
        </Typography.Title>
        <Button type="primary" onClick={() => setShowSaved(true)}>
          View Saved JSON
        </Button>
      </Header>
      <Content style={{ padding: 24 }}>
        <div style={{ background: '#fff', padding: 24, minHeight: 360, borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}>
          <SchemaBuilder showSaved={showSaved} setShowSaved={setShowSaved} />
        </div>
      </Content>
    </Layout>
  );
};

export default App;
