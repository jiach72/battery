import React, { useEffect, useState } from 'react';
import { Tree, Table, Button, Modal, Form, Input, InputNumber, message, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { EnergyUnit, TopologyTree } from '../../types/station';
import { fetchStations, fetchTopologyTree, createUnit, createCluster } from '../../store/slices/deviceSlice';
import ConsoleMetricTile from '../../components/console/ConsoleMetricTile';
import ConsolePageHeader from '../../components/console/ConsolePageHeader';
import ConsolePanel from '../../components/console/ConsolePanel';
import PageEmpty from '../../components/PageEmpty';
import { usePagination } from '../../hooks/usePagination';

interface TreeNodeRecord {
  key: string;
  title: string;
  nodeType: 'station' | 'unit';
  entityId: string;
  stationId: string;
  children?: TreeNodeRecord[];
}

export default function DeviceLedger() {
  const dispatch = useAppDispatch();
  const { stations, topologyTree, error } = useAppSelector((state) => state.device);
  const [selectedStationId, setSelectedStationId] = useState<string | undefined>(undefined);
  const [selectedNode, setSelectedNode] = useState<TreeNodeRecord | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'unit' | 'cluster'>('unit');
  const [form] = Form.useForm();
  const { antdPagination } = usePagination(10);

  useEffect(() => {
    dispatch(fetchStations());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedStationId && stations[0]) {
      setSelectedStationId(stations[0].id);
    }
  }, [stations, selectedStationId]);

  useEffect(() => {
    if (selectedStationId) {
      dispatch(fetchTopologyTree(selectedStationId));
      setSelectedNode(null);
    }
  }, [dispatch, selectedStationId]);

  const retry = () => {
    dispatch(fetchStations());
    if (selectedStationId) dispatch(fetchTopologyTree(selectedStationId));
  };

  if (error) {
    return <PageEmpty description={error} actionText="重试" onAction={retry} />;
  }

  const treeData = topologyTree ? buildTreeData(topologyTree) : stations.map((station) => ({
    title: station.name,
    key: `station:${station.id}`,
    nodeType: 'station' as const,
    entityId: station.id,
    stationId: station.id,
    isLeaf: false,
  }));

  const handleSelect = (key: string) => {
    const node = findNode(treeData as TreeNodeRecord[], key);
    if (!node) {
      setSelectedNode(null);
      return;
    }
    setSelectedNode(node);
    if (node.nodeType === 'station') {
      dispatch(fetchTopologyTree(node.entityId));
    }
  };

  const handleAdd = () => {
    if (!selectedNode) {
      message.warning('请先选择一个站点或储能单元');
      return;
    }
    if (selectedNode.nodeType === 'station') {
      setAddType('unit');
    } else if (selectedNode.nodeType === 'unit') {
      setAddType('cluster');
    } else {
      message.warning('请选择站点或储能单元节点');
      return;
    }
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      if (!selectedNode) {
        return;
      }
      const values = await form.validateFields();
      if (addType === 'unit') {
        await dispatch(createUnit({ stationId: selectedNode.stationId, name: values.name, capacity: values.capacity })).unwrap();
      } else {
        await dispatch(createCluster({ unitId: selectedNode.entityId, name: values.name, clusterNo: values.clusterNo })).unwrap();
      }
      message.success('创建成功');
      setAddModalOpen(false);
      form.resetFields();
      dispatch(fetchTopologyTree(selectedNode.stationId));
    } catch {
      // error handled by slice
    }
  };

  return (
    <div className="space-y-5">
      <ConsolePageHeader
        title="设备台账"
        subtitle="值班员在这里快速确认站点、储能单元与簇的资产结构，并执行最小配置动作。"
        actions={
          <>
            <div className="console-status-pill">
              <span className="console-status-pill__label">
                <span className="console-status-pill__dot console-status-pill__dot--accent" />
                当前站点
              </span>
              <Select
                value={selectedStationId}
                size="small"
                variant="borderless"
                popupMatchSelectWidth={false}
                onChange={setSelectedStationId}
                options={stations.map((station) => ({ value: station.id, label: station.name }))}
              />
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增设备</Button>
          </>
        }
      />

      <div className="console-grid-hero">
        <div data-span="4"><ConsoleMetricTile label="电站数量" value={`${stations.length} 座`} hint="当前已纳入运维视图的站点" /></div>
        <div data-span="4"><ConsoleMetricTile label="当前上下文" value={selectedNode?.title || '未选择'} hint="从左侧结构树切换操作对象" /></div>
        <div data-span="4"><ConsoleMetricTile label="当前视角" value={selectedNode ? (selectedNode.nodeType === 'unit' ? '储能单元' : '站点') : '未选择'} hint="设备树按站级 / 单元级查看" /></div>
      </div>

      <div className="console-grid-hero">
        <div data-span="4">
          <ConsolePanel
            title="资产结构树"
            subtitle="以站点为入口，向下查看储能单元与簇结构。"
          >
            <div className="console-tree-shell">
              <Tree treeData={treeData} defaultExpandAll onSelect={(keys) => { if (keys[0]) handleSelect(keys[0] as string); }} />
            </div>
          </ConsolePanel>
        </div>
        <div data-span="8">
          <ConsolePanel
            title="当前对象属性"
            subtitle="选中节点后，在右侧查看当前对象的基本属性与状态。"
          >
            <div className="console-table-shell">
              <Table
                dataSource={selectedNode ? [{
                  key: selectedNode.key,
                  name: selectedNode.title,
                  type: selectedNode.nodeType === 'station' ? '站点' : '储能单元',
                  status: '在线',
                  capacity: selectedNode.nodeType === 'station' ? '512 kWh' : '256 kWh',
                }] : []}
                columns={[
                  { title: '名称', dataIndex: 'name' },
                  { title: '类型', dataIndex: 'type' },
                  { title: '状态', dataIndex: 'status' },
                  { title: '容量', dataIndex: 'capacity' },
                ]}
                size="small"
                locale={{ emptyText: '请在左侧选择设备' }}
                pagination={antdPagination}
              />
            </div>
          </ConsolePanel>
        </div>
      </div>

      <Modal title={addType === 'unit' ? '新建储能单元' : '新建电池簇'} open={addModalOpen} onOk={handleAddSubmit} onCancel={() => { setAddModalOpen(false); form.resetFields(); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}> <Input /> </Form.Item>
          {addType === 'unit' && (
            <Form.Item name="capacity" label="容量 (kWh)"> <InputNumber min={0} className="w-full" /> </Form.Item>
          )}
          {addType === 'cluster' && (
            <Form.Item name="clusterNo" label="簇编号"> <InputNumber min={1} className="w-full" /> </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

function buildTreeData(topologyTree: TopologyTree): TreeNodeRecord[] {
  return topologyTree.stations.map((station) => ({
    title: station.name,
    key: `station:${station.id}`,
    nodeType: 'station',
    entityId: station.id,
    stationId: station.id,
    children: (station.energyUnits || []).map((unit: EnergyUnit) => ({
      title: unit.name,
      key: `unit:${unit.id}`,
      nodeType: 'unit',
      entityId: unit.id,
      stationId: station.id,
    })),
  }));
}

function findNode(nodes: TreeNodeRecord[], key: string): TreeNodeRecord | null {
  for (const node of nodes) {
    if (node.key === key) {
      return node;
    }
    if (node.children) {
      const found = findNode(node.children, key);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
