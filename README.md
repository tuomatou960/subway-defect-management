# 道路病害管理系统

## 项目概述
基于React开发的道路病害管理平台，主要功能包括：
- 病害图片上传（支持JPG/PNG格式）
- 经纬度坐标录入与地图标注展示
- 病害类型选择（裂缝/沉降/渗漏）
- 历史记录管理（查看/删除）
- 病害类型统计图表可视化

## 技术栈

## 项目结构
```
frontend/
├── public/            # 静态资源
├── src/
│   ├── components/   # 公共组件
│   ├── features/     # 业务模块
│   │   ├── upload/   # 图片上传模块
│   │   ├── map/      # 地图展示模块
│   │   └── chart/    # 数据可视化模块
│   ├── utils/        # 工具函数
│   └── stores/       # 状态管理
```

## 技术实现细节
### 图片上传校验
- 前端校验：通过Antd Upload组件的beforeUpload钩子
  ```jsx
  beforeUpload(file) {
    const isImage = ['image/jpeg','image/png'].includes(file.type);
    const isLt10M = file.size / 1024 / 1024 < 10;
    return isImage && isLt10M;
  }
  ```
- 服务端校验：通过文件魔数校验真实文件类型

### 地图标记渲染
```jsx
<Marker position={[lat, lng]} icon={L.icon({
  iconUrl: getMarkerColor(type), // 根据病害类型返回不同颜色图标
  iconSize: [32, 37]
})}>
  <Popup>{/* 病害详细信息 */}</Popup>
</Marker>
```

### 图表实时更新
```jsx
// 使用ECharts的setOption实现增量更新
echartInstance.setOption({
  series: [{
    data: newData
  }]
}, { replaceMerge: ['series'] });
```

## 部署指南
### Docker部署
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

## 开发规范
### ESLint配置
```json
{
  "extends": "airbnb",
  "rules": {
    "react/jsx-filename-extension": [1, { "extensions": [".jsx", ".tsx"] }]
  }
}
```

## 数据存储方案
| 数据类型       | 存储方式                | 说明                   |
|----------------|-------------------------|-----------------------|
| 病害元数据     | IndexedDB               | 包含坐标、类型等信息   |
| 图片文件       | 对象存储(MinIO/S3兼容)  | 支持断点续传           |
| 统计结果       | LocalStorage            | 图表展示缓存数据       |

- 前端框架：React 19
- UI组件库：Ant Design 5.x
- 地图组件：Leaflet 1.9 + react-leaflet 5
- 图表可视化：ECharts 5 + echarts-for-react 3
- 构建工具：Vite 6

## 环境配置
1. 安装Node.js v18+ 
2. 安装项目依赖：
```bash
cd frontend
npm install
