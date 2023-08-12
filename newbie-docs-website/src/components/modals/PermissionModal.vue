<template>
    <a-modal v-if="dataType && (book || doc)" v-model:visible="modalVisible"
        :modal-style="{ 'min-height': '300px', 'max-height': '75vh', 'overflow-y': 'auto' }" :closable="false"
        :footer="false" :width="width">
        <template #title>
            <a-button style="position: absolute; right: 20px;" type="text" @click="add"
                :disabled="modalData.tableData.some(item => item.editMode)">添加</a-button>
            <template v-if="dataType === 1 && book">
                “{{ book.title }}” 知识库权限管理
            </template>
            <template v-else-if="dataType === 2 && doc">
                “{{ doc.title }}” 文档权限管理
            </template>
        </template>
        <a-table :columns="columns" :data="modalData.tableData" :pagination="{ pageSize: 8, showTotal: true }">
            <template #ownerType="{ record }">
                <a-select v-if="record.editMode" :disabled="!record.editMode" :options="ownerTypes"
                    v-model="record.ownerType" />
                <template v-else v-for="item of ownerTypes">
                    <span v-if="item.value === record.ownerType">{{ item.label }}</span>
                </template>
            </template>
            <template #owner="{ record }">
                <a-input v-if="record.editMode" v-model="record.owner" :error="record.owner.length <= 0" />
                <span v-else>{{ record.owner }}</span>
            </template>
            <template #authType="{ record }">
                <a-select :options="authTypes" v-model="record.authType"
                    :disabled="!record.editMode && modalData.tableData.filter(item => item.id && item.id > 0).length <= 1"
                    @change="record.editMode ? () => { } : changeAuthType(record.id, record.authType)" />
            </template>
            <template #actions="{ record }">
                <template v-if="record.editMode">
                    <a-button size="small" type="primary" @click="save(record)" style="margin-right: 10px;">确定</a-button>
                    <a-button size="small" @click="cancel(record)">取消</a-button>
                </template>
                <a-popconfirm v-else content="确定要删除吗？" @ok="remove(record)">
                    <a-button size="small" status="danger"
                        :disabled="modalData.tableData.filter(item => item.id && item.id > 0).length <= 1">删除</a-button>
                </a-popconfirm>
            </template>
        </a-table>
    </a-modal>
</template>

<script setup lang="ts">
import { Book, Doc, Permission } from '@/types/global';
import { Message, TableColumnData, TableData } from '@arco-design/web-vue';
import { reactive, toRefs, computed, PropType, onBeforeMount } from 'vue';
import { usePermissionsApi } from '@/api/permissions';

const permissionsApi = usePermissionsApi('localStorage')

const props = defineProps({
    /**
     * 1 book、2 doc
     */
    dataType: {
        type: Number,
        required: true,
    },
    book: {
        type: Object as PropType<Book>,
        default: () => ({}),
        required: false,
    },
    doc: {
        type: Object as PropType<Doc>,
        default: () => ({}),
        required: false,
    },
    visible: {
        type: Boolean,
        default: false,
        required: true,
    },
    width: {
        type: String,
        default: '750px',
    },
});
const emit = defineEmits(['update:visible'])

const { book, doc, visible, dataType, width } = toRefs(props)

const modalVisible = computed({
    get() {
        return visible.value
    },
    set(val) {
        emit('update:visible', val)
    }
})

const ownerTypes = [
    {
        label: '用户',
        value: 1
    },
    {
        label: '部门',
        value: 2
    }
]

const authTypes = [{
    label: '可管理',
    value: 1
}, {
    label: '可编辑',
    value: 2
}, {
    label: '可阅读',
    value: 3
}]

const columns = [
    {
        title: '类型',
        dataIndex: 'ownerType',
        slotName: 'ownerType',
        width: 150
    },
    {
        title: '拥有者',
        dataIndex: 'owner',
        slotName: 'owner',
    },
    {
        title: '权限',
        dataIndex: 'authType',
        slotName: 'authType',
        width: 150
    },
    {
        title: '操作',
        slotName: 'actions',
        fixed: 'right',
        width: 175
    },
] as TableColumnData[]

const modalData = reactive({
    tableData: []
}) as {
    tableData: {
        id?: number,
        ownerType: number,
        owner: string,
        authType: number,
        editMode: boolean
    }[]
}

const loadTableData = async () => {
    let permissions = [] as Permission[]
    // 1 book、2 doc
    if (dataType.value === 1) {
        permissions = await permissionsApi.list({
            dataType: dataType.value,
            dataId: book.value.id,
            dataSlug: book.value.slug,
        }) as Permission[]
    } else if (dataType.value === 2) {
        permissions = await permissionsApi.list({
            dataType: dataType.value,
            dataId: doc.value.id,
            dataSlug: doc.value.bookSlug + '/' + doc.value.slug,
        }) as Permission[]
    }

    return permissions.map(item => {
        return {
            id: item.id,
            ownerType: item.ownerType,
            owner: item.owner,
            authType: item.authType,
            editMode: false
        }
    })
}

onBeforeMount(async () => {
    modalData.tableData = await loadTableData()
})

const add = (ev: Event) => {
    modalData.tableData.push({ ownerType: 1, owner: '', authType: 3, editMode: true })
}

const save = async (record: TableData) => {
    if (record.owner === undefined || record.owner === '') {
        Message.error('拥有者不能为空')
        return
    }

    const result = await permissionsApi.put({
        id: -1,
        dataType: dataType.value,
        dataId: (dataType.value === 1 ? book.value.id : doc.value.id) as number,
        dataSlug: dataType.value === 1 ? book.value.slug : doc.value.bookSlug + '/' + doc.value.slug,
        ownerType: record.ownerType,
        owner: record.owner,
        authType: record.authType,
    })

    if (result) {
        modalData.tableData = await loadTableData()
        record.editMode = false
        Message.success('添加成功')
    } else {
        Message.error('添加失败')
    }
}

const cancel = async (record: TableData) => {
    // 剔除当前编辑的数据
    modalData.tableData = modalData.tableData.filter(item => item !== record)
    record.editMode = false
}

const remove = async (record: TableData) => {
    const result = await permissionsApi.remove(record.id)
    if (result) {
        modalData.tableData = await loadTableData()
        Message.success('删除成功')
    } else {
        Message.error('删除失败')
    }
}

const changeAuthType = async (id: number, authType: number) => {
    const result = await permissionsApi.changeAuthType(id, authType)
    if (result) {
        modalData.tableData = await loadTableData()
        Message.success('更新成功')
    } else {
        Message.error('更新失败')
    }
}
</script>

<style scoped></style>