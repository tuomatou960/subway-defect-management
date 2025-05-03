import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Upload, Button, Form, Input, Select, Table, Modal, Image } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { message } from 'antd';

const { Option } = Select;

const DISEASE_COLORS = {
  裂缝: '#ff4d4f',
  沉降: '#faad14',
  渗漏: '#52c41a'
};

function App() {
  const [coordinates, setCoordinates] = useState({ lat: 31.23, lng: 121.47 });
const [mapInitialized, setMapInitialized] = useState(false);
  const [historyData, setHistoryData] = useState(() => {
    const saved = localStorage.getItem('diseaseRecords');
    return saved ? JSON.parse(saved) : [];
  });
  const [form] = Form.useForm();
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const chartDom = document.querySelector('.chart-container');
    if (chartDom) {
      const handleResize = () => {
        window.dispatchEvent(new Event('resize'));
        chartDom.echartsInstance?.resize();
      };
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(chartDom);
      setTimeout(handleResize, 100);
      return () => {
        resizeObserver.disconnect();
        chartDom.echartsInstance?.dispose();
      };
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('diseaseRecords', JSON.stringify(historyData));
    return () => {
      historyData.forEach(record => {
        
      });
    };
  }, [historyData]);

  const columns = [
    { title: '时间', dataIndex: 'time', key: 'time' },
    { title: '病害类型', dataIndex: 'type', key: 'type' },
    { title: '经度', dataIndex: 'lng', key: 'lng' },
    { title: '纬度', dataIndex: 'lat', key: 'lat' },
    {
      title: '图片预览',
      dataIndex: 'base64Image',
      key: 'base64Image',
      render: (base64Image) => base64Image ? (
        <Image
          width={64}
          src={base64Image}
          
          onClick={() => setPreviewImage(base64Image)}
          style={{ cursor: 'pointer', borderRadius: 4 }}
        />
      ) : '无图片'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button danger onClick={() => handleDelete(record.key)}>删除</Button>
      ),
    },
  ];

  const handleSubmit = (values) => {
    const file = values.fileList?.[0]?.originFileObj;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newRecord = {
        key: Date.now(),
        time: new Date().toLocaleString(),
        ...values,
        lat: parseFloat(values.lat),
        lng: parseFloat(values.lng),
        base64Image: e.target.result
      };
      setHistoryData(prev => {
        const newData = [...prev, newRecord];
        localStorage.setItem('diseaseRecords', JSON.stringify(newData));
        return newData;
      });
      form.resetFields();
      message.success('数据提交成功！');
    };
    reader.readAsDataURL(file);
  }

  const handleDelete = (key) => {
    setHistoryData(prev => {
      const deletedItem = prev.find(item => item.key === key);
      
      const newData = prev.filter(item => item.key !== key);
      localStorage.setItem('diseaseRecords', JSON.stringify(newData));
      return newData;
    });
  };

  const getChartData = () => {
    const defaultData = { 裂缝: 0, 沉降: 0, 渗漏: 0 };
    const typeCounts = historyData.length > 0 ? 
      historyData.reduce((acc, { type }) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}) 
    : defaultData;

    return {
      animation: true,
      textStyle: {
        fontFamily: 'Arial'
      },
      series: [{
        type: 'pie',
        data: Object.entries(typeCounts).map(([name, value]) => ({ name, value })),
        radius: '55%',
        label: {
          show: historyData.length > 0,
          formatter: '{b}: {c} ({d}%)',
          fontSize: 14
        },
        itemStyle: {
          color: ({ name }) => DISEASE_COLORS[name],
          borderWidth: 2,
          borderColor: '#fff'
        }
      }],
      title: {
        text: historyData.length === 0 ? '暂无数据' : '',
        left: 'center',
        top: 'middle',
        textStyle: {
          fontSize: 16,
          color: '#999'
        }
      }
    };
  };

  return (
    <div className="app-container">
      
      <div className="form-section">
          <h3>上传</h3>
          <Form form={form} onFinish={handleSubmit}>
          <Form.Item label="病害图片" name="fileList" valuePropName="fileList" rules={[{ required: true, message: '请上传病害图片' }]}>
            <Upload beforeUpload={() => false} fileList={form.getFieldValue('fileList')} onChange={({ fileList }) => form.setFieldsValue({ fileList })}>
              <Button icon={<UploadOutlined />}>点击上传</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item label="病害类型" name="type" rules={[{ required: true, message: '请选择病害类型' }]}>
            <Select placeholder="请选择病害类型">
              <Option value="裂缝">裂缝</Option>
              <Option value="沉降">沉降</Option>
              <Option value="渗漏">渗漏</Option>
            </Select>
          </Form.Item>

          <Form.Item label="经度" name="lng" rules={[{ required: true }]}>
            <Input type="number" step="0.000001" />
          </Form.Item>

          <Form.Item label="纬度" name="lat" rules={[{ required: true }]}>
            <Input type="number" step="0.000001" />
          </Form.Item>

          <Button type="primary" htmlType="submit">提交</Button>
        </Form>
      </div>

      <div className="map-container">
          <h3>地图</h3>
          <MapContainer
          key={`${coordinates.lat}-${coordinates.lng}`}
          center={[coordinates.lat, coordinates.lng]}
          zoom={13}
          style={{ height: '400px', width: '100%' }}
          whenCreated={map => {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            setMapInitialized(true);
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {historyData.length > 0 && historyData.map(record => (
            <Marker 
              key={record.key} 
              position={[record.lat, record.lng]}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `<div style='background:${DISEASE_COLORS[record.type]}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white'></div>`
              })}
              eventHandlers={{
                click: (e) => {
                  setPreviewImage(record.base64Image);
                },
                mouseover: (e) => {
                  e.target.bindPopup(`病害类型：${record.type}`).openPopup();
                },
                mouseout: (e) => {
                  e.target.closePopup();
                }
              }}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <h4 style={{ marginBottom: 8 }}>病害详情</h4>
                  <p>类型：{record.type}</p>
                  <p>时间：{record.time}</p>
                  <p>坐标：{record.lat.toFixed(6)}, {record.lng.toFixed(6)}</p>
                  {record.image && 
                    <div style={{ marginTop: 12 }}>
                      <img
                        src={record.base64Image}
                        alt="病害预览"
                        style={{
                          width: '100%',
                          borderRadius: 4,
                          cursor: 'pointer',
                          border: '1px solid #f0f0f0'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(record.base64Image);
                        }}
                      />
                      <div style={{ 
                        color: '#1677ff',
                        fontSize: 12,
                        textAlign: 'center',
                        marginTop: 8
                      }}>
                        点击图片放大
                      </div>
                    </div>
                  }
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="chart-container">
          <h3>统计图表</h3>
          {historyData.length > 0 ? (
          <ReactECharts option={getChartData()} />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            图表将在添加数据后显示
          </div>
        )}
      </div>

      <div className="history-table">
          <h3>历史记录</h3>
          <Table columns={columns} dataSource={historyData} />
      </div>
      <Modal
        open={!!previewImage}
        title="病害图片预览"
        footer={null}
        onCancel={() => setPreviewImage(null)}
      >
        <Image
          alt="病害图片"
          src={previewImage}
          style={{ width: '100%' }}
          preview={{
            maskClassName: 'custom-preview-mask'
          }}
        />
      </Modal>
    </div>
  );
}

export default App;