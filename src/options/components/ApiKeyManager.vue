<template>
  <div class="api-manager">
    <div class="api-list">
      <div
        v-for="api in apiConfigs"
        :key="api.id"
        class="api-item"
        :class="{ active: api.isActive }"
        @click="activateApi(api.id)"
      >
        <div class="api-info">
          <div class="api-name">{{ api.name }}</div>
          <div class="api-model">{{ api.model }}</div>
        </div>
        <div class="api-actions">
          <button class="edit-btn" @click.stop="editApi(api)">编辑</button>
          <button class="delete-btn" @click.stop="deleteApi(api.id)">删除</button>
        </div>
        <div v-if="api.isActive" class="active-badge">使用中</div>
      </div>
    </div>

    <button v-if="!showForm" class="add-btn" @click="showForm = true">
      + 添加 API Key
    </button>

    <div v-if="showForm" class="api-form">
      <div class="form-row">
        <label>名称</label>
        <input v-model="formData.name" type="text" placeholder="例如: OpenAI" />
      </div>
      <div class="form-row">
        <label>API Key</label>
        <input v-model="formData.apiKey" type="password" placeholder="sk-..." />
      </div>
      <div class="form-row">
        <label>Base URL</label>
        <input v-model="formData.baseUrl" type="text" placeholder="https://api.openai.com/v1" />
      </div>
      <div class="form-row">
        <label>模型</label>
        <input v-model="formData.model" type="text" placeholder="gpt-3.5-turbo" />
      </div>
      <div class="form-actions">
        <button class="cancel-btn" @click="cancelForm">取消</button>
        <button class="save-btn" @click="saveApi">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ApiConfig } from '../../types'
import { getApiConfigs, saveApiConfigs, setActiveApiId } from '../../background/storage'

const apiConfigs = ref<ApiConfig[]>([])
const showForm = ref(false)
const editingId = ref<string | null>(null)

const formData = ref({
  name: '',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo'
})

onMounted(async () => {
  apiConfigs.value = await getApiConfigs()
})

function resetForm() {
  formData.value = {
    name: '',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo'
  }
  editingId.value = null
  showForm.value = false
}

function cancelForm() {
  resetForm()
}

async function saveApi() {
  if (!formData.value.name || !formData.value.apiKey) {
    alert('请填写名称和 API Key')
    return
  }

  let configs = await getApiConfigs()

  if (editingId.value) {
    configs = configs.map(c =>
      c.id === editingId.value
        ? { ...c, ...formData.value }
        : c
    )
  } else {
    const newApi: ApiConfig = {
      id: Date.now().toString(),
      ...formData.value,
      isActive: configs.length === 0
    }
    configs.push(newApi)
  }

  try {
    await saveApiConfigs(configs)
    apiConfigs.value = configs  // Update local state on success only
    if (apiConfigs.value.length === 1) {
      await setActiveApiId(apiConfigs.value[0].id)
    }
    resetForm()
  } catch (err) {
    console.error('保存失败:', err)
    alert('保存失败，请重试')
  }
}

function editApi(api: ApiConfig) {
  editingId.value = api.id
  formData.value = {
    name: api.name,
    apiKey: api.apiKey,
    baseUrl: api.baseUrl,
    model: api.model
  }
  showForm.value = true
}

async function deleteApi(id: string) {
  if (!confirm('确定要删除这个 API 配置吗？')) return

  let configs = await getApiConfigs()
  configs = configs.filter(c => c.id !== id)
  await saveApiConfigs(configs)
  apiConfigs.value = configs

  // 如果删除的是当前激活的，激活第一个
  if (configs.length > 0 && !configs.some(c => c.isActive)) {
    await setActiveApiId(configs[0].id)
    // Update local state to reflect the new active ID without re-fetching
    apiConfigs.value = configs.map((c, i) => ({
      ...c,
      isActive: i === 0
    }))
  }
}

async function activateApi(id: string) {
  await setActiveApiId(id)
  apiConfigs.value = await getApiConfigs()
}
</script>

<style scoped>
.api-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.api-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #2d2d2d;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.api-item:hover {
  background: #3d3d3d;
}

.api-item.active {
  border: 2px solid #4f46e5;
}

.api-info {
  flex: 1;
}

.api-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.api-model {
  font-size: 12px;
  color: #9ca3af;
}

.api-actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: opacity 0.2s;
}

.edit-btn {
  background: #4b5563;
  color: white;
}

.delete-btn {
  background: #dc2626;
  color: white;
}

.edit-btn:hover,
.delete-btn:hover {
  opacity: 0.8;
}

.active-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  background: #4f46e5;
  color: white;
  font-size: 10px;
  border-radius: 4px;
}

.add-btn {
  padding: 12px;
  background: transparent;
  color: #4f46e5;
  border: 2px dashed #4f46e5;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background 0.2s;
}

.add-btn:hover {
  background: rgba(79, 70, 229, 0.1);
}

.api-form {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
}

.form-row {
  margin-bottom: 16px;
}

.form-row label {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
}

.form-row input {
  width: 100%;
  padding: 10px 12px;
  background: #1f1f1f;
  color: #e5e7eb;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-row input:focus {
  outline: none;
  border-color: #4f46e5;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.cancel-btn {
  background: #4b5563;
  color: white;
}

.save-btn {
  background: #4f46e5;
  color: white;
}

.cancel-btn:hover,
.save-btn:hover {
  opacity: 0.9;
}
</style>
