import React, { useState } from 'react';
import { Card, Input, Select, Space, Button, Row, Col, Modal, message, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

export type FieldType = 'string' | 'number' | 'nested' | 'boolean' | 'array' | 'null';

export interface SchemaField {
  id: string;
  key: string;
  type?: FieldType;
  children?: SchemaField[];
}

interface SchemaBuilderProps {
  showSaved: boolean;
  setShowSaved: (show: boolean) => void;
}

const initialFields: SchemaField[] = [];

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now();
}

function updateFieldAtPath(fields: SchemaField[], path: number[], updater: (f: SchemaField) => SchemaField): SchemaField[] {
  if (path.length === 0) return fields;
  const [idx, ...rest] = path;
  return fields.map((field, i) => {
    if (i !== idx) return field;
    if (rest.length === 0) {
      return updater(field);
    } else if (field.type === 'nested' && field.children) {
      return {
        ...field,
        children: updateFieldAtPath(field.children, rest, updater),
      };
    } else {
      return field;
    }
  });
}

function addFieldAtPath(fields: SchemaField[], path: number[]): SchemaField[] {
  if (path.length === 0) {
    return [
      ...fields,
      { id: generateId(), key: '', type: undefined },
    ];
  }
  const [idx, ...rest] = path;
  return fields.map((field, i) => {
    if (i !== idx) return field;
    if (field.type === 'nested' && field.children) {
      return {
        ...field,
        children: addFieldAtPath(field.children, rest),
      };
    }
    return field;
  });
}

function deleteFieldAtPath(fields: SchemaField[], path: number[]): SchemaField[] {
  if (path.length === 1) {
    return fields.filter((_, i) => i !== path[0]);
  }
  const [idx, ...rest] = path;
  return fields.map((field, i) => {
    if (i !== idx) return field;
    if (field.type === 'nested' && field.children) {
      return {
        ...field,
        children: deleteFieldAtPath(field.children, rest),
      };
    }
    return field;
  });
}

function buildJson(fields: SchemaField[]): any {
  const obj: any = {};
  fields.forEach(field => {
    if (!field.key || !field.type) return;
    if (field.type === 'string') {
      obj[field.key] = '';
    } else if (field.type === 'number') {
      obj[field.key] = 0;
    } else if (field.type === 'boolean') {
      obj[field.key] = false;
    } else if (field.type === 'null') {
      obj[field.key] = null;
    } else if (field.type === 'array') {
      obj[field.key] = [''];
    } else if (field.type === 'nested' && field.children) {
      obj[field.key] = buildJson(field.children);
    }
  });
  return obj;
}

function validateFields(fields: SchemaField[]): boolean {
  for (const field of fields) {
    if (!field.key || !field.type) return false;
    if (field.type === 'nested' && field.children) {
      if (!validateFields(field.children)) return false;
    }
  }
  return true;
}

const SchemaBuilder: React.FC<SchemaBuilderProps> = ({ showSaved, setShowSaved }) => {
  const [fields, setFields] = useState<SchemaField[]>(initialFields);
  const [modalJson, setModalJson] = useState<string>('');

  const handleKeyChange = (path: number[], value: string) => {
    setFields(prev => updateFieldAtPath(prev, path, f => ({ ...f, key: value })));
  };

  const handleTypeChange = (path: number[], value: FieldType) => {
    setFields(prev => updateFieldAtPath(prev, path, f => {
      if (value === 'nested') {
        return { ...f, type: value, children: f.children || [] };
      } else {
        const { children, ...rest } = f;
        return { ...rest, type: value };
      }
    }));
  };

  const handleAddField = (path: number[]) => {
    setFields(prev => addFieldAtPath(prev, path));
  };

  const handleDeleteField = (path: number[]) => {
    setFields(prev => deleteFieldAtPath(prev, path));
  };

  const handleSubmit = () => {
    if (!fields.length) {
      message.error('Please add at least one field.');
      return;
    }
    if (!validateFields(fields)) {
      message.error('All fields must have a name and a type.');
      return;
    }
    const json = buildJson(fields);
    localStorage.setItem('json-schema-builder', JSON.stringify(json, null, 2));
    message.success('Schema saved!');
  };

  React.useEffect(() => {
    if (showSaved) {
      const saved = localStorage.getItem('json-schema-builder') || '';
      setModalJson(saved);
    }
  }, [showSaved]);

  const renderFields = (fields: SchemaField[], path: number[] = [], level = 0) => (
    <Space direction="vertical" style={{ width: '100%' }}>
      {fields.map((field, idx) => {
        const currentPath = [...path, idx];
        return (
          <Card size="small" key={field.id} style={{ marginLeft: level * 24 }}>
            <Space>
              <Input
                value={field.key}
                style={{ width: 120 }}
                onChange={e => handleKeyChange(currentPath, e.target.value)}
                placeholder="Field name"
              />
              <Select
                value={field.type}
                style={{ width: 120 }}
                onChange={val => handleTypeChange(currentPath, val as FieldType)}
                placeholder="Select"
              >
                <Option value="string">String</Option>
                <Option value="number">Number</Option>
                <Option value="boolean">Boolean</Option>
                <Option value="array">Array</Option>
                <Option value="null">Null</Option>
                <Option value="nested">Nested</Option>
              </Select>
              {field.type === 'nested' && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => handleAddField(currentPath)}
                  style={{ marginLeft: 8 }}
                >
                  Add Field
                </Button>
              )}
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
                onClick={() => handleDeleteField(currentPath)}
                disabled={path.length === 0 && fields.length === 1}
                title="Delete Field"
              />
            </Space>
            {field.type === 'nested' && field.children && (
              <div style={{ marginTop: 12 }}>
                {renderFields(field.children, currentPath, level + 1)}
              </div>
            )}
          </Card>
        );
      })}
      {path.length === 0 && (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => handleAddField(path)}
        >
          Add Field
        </Button>
      )}
    </Space>
  );

  return (
    <>
      <Row gutter={24}>
        <Col xs={24} md={14}>
          <Typography.Title level={4}>Schema Builder</Typography.Title>
          {renderFields(fields)}
          <Button type="primary" style={{ marginTop: 24 }} onClick={handleSubmit}>
            Submit
          </Button>
        </Col>
        <Col xs={24} md={10}>
          <Typography.Title level={4}>JSON Preview</Typography.Title>
          <Card style={{ minHeight: 200 }}>
            <pre style={{ background: 'none', padding: 0, borderRadius: 0, margin: 0 }}>
              {JSON.stringify(buildJson(fields), null, 2)}
            </pre>
          </Card>
        </Col>
      </Row>
      <Modal
        open={showSaved}
        onCancel={() => setShowSaved(false)}
        footer={null}
        title={<Typography.Title level={5} style={{ margin: 0 }}>Saved JSON Schema</Typography.Title>}
        width={600}
      >
        <Card style={{ minHeight: 200 }}>
          <pre style={{ background: 'none', padding: 0, borderRadius: 0, margin: 0 }}>
            {modalJson || 'No saved schema found.'}
          </pre>
        </Card>
      </Modal>
    </>
  );
};

export default SchemaBuilder;