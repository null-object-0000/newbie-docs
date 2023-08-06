<template>
    <a-modal v-if="dataType && (book || doc)" v-model:visible="modalVisible"
        :modal-style="{ 'min-height': '300px', 'max-height': '75vh', 'overflow-y': 'scroll' }" :closable="false"
        :footer="false" :width="width">
        <template #title>
            <a-button style="position: absolute; right: 20px;" type="text" @click="add"
                :disabled="modalData.tableData.some(item => item.editMode)">添加</a-button>
            <template v-if="dataType === 'book' && book">
                “{{ book.title }}” 知识库权限管理
            </template>
            <template v-else-if="dataType === 'doc' && doc">
                “{{ doc.title }}” 文档权限管理
            </template>
        </template>
        <a-table :columns="columns" :data="modalData.tableData" :pagination="{ pageSize: 8, showTotal: true }">
            <template #ownerType="{ record }">
                <a-select :disabled="!record.editMode" :options="ownerTypes" v-model="record.ownerType" />
            </template>
            <template #owner="{ record }">
                <a-input v-if="record.editMode" v-model="record.owner" />
                <span v-else>{{ record.owner }}</span>
            </template>
            <template #authType="{ record }">
                <a-select :options="authTypes" v-model="record.authType"
                    @change="changeAuthType(record.id, record.authType)" />
            </template>
            <template #actions="{ record }">
                <a-button v-if="record.editMode" type="text" @click="save(record)">确定</a-button>
                <a-popconfirm v-else content="确定要删除吗？" @ok="remove(record)">
                    <a-button type="text" status="danger">删除</a-button>
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
    dataType: {
        type: String as PropType<'book' | 'doc'>,
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
        value: 'user'
    },
    {
        label: '部门',
        value: 'department'
    }
]

const authTypes = [{
    label: '可管理',
    value: 'adminer'
}, {
    label: '可编辑',
    value: 'editor'
}, {
    label: '可阅读',
    value: 'reader'
}]

const columns = [
    {
        title: '拥有者类型',
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
        width: 150
    },
] as TableColumnData[]

const modalData = reactive({
    tableData: []
}) as {
    tableData: {
        ownerType: 'user' | 'department',
        owner: string,
        authType: 'adminer' | 'editor' | 'reader',
        editMode: boolean
    }[]
}

const loadTableData = async () => {
    console.log('loadTableData', dataType.value, book.value, doc.value)

    let permissions = [] as Permission[]
    if (dataType.value === 'book') {
        permissions = await permissionsApi.list({
            dataType: dataType.value,
            dataId: book.value.id,
            dataFlag: book.value.slug,
        }) as Permission[]
    } else if (dataType.value === 'doc') {
        permissions = await permissionsApi.list({
            dataType: dataType.value,
            dataId: doc.value.id,
            dataFlag: doc.value.bookSlug + '/' + doc.value.slug,
        }) as Permission[]
    }

    return permissions.map(item => {
        return {
            id: item.id,
            ownerType: item.ownerType as 'user' | 'department',
            owner: item.owner,
            authType: item.authType as 'adminer' | 'editor' | 'reader',
            editMode: false
        }
    })
}

onBeforeMount(async () => {
    modalData.tableData = await loadTableData()
})

const add = (ev: Event) => {
    console.log('add', ev)
    modalData.tableData.push({ ownerType: 'user', owner: '', authType: 'reader', editMode: true })
}

const save = async (record: TableData) => {
    console.log('save', record)

    const result = await permissionsApi.put({
        id: Math.ceil(Math.random() * 1000000000),
        dataType: dataType.value,
        dataId: dataType.value === 'book' ? book.value.id : doc.value.id,
        dataFlag: dataType.value === 'book' ? book.value.slug : doc.value.bookSlug + '/' + doc.value.slug,
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

const remove = async (record: TableData) => {
    console.log('remove', record)

    const result = await permissionsApi.remove(record.id)
    if (result) {
        modalData.tableData = await loadTableData()
        Message.success('删除成功')
    } else {
        Message.error('删除失败')
    }
}

const changeAuthType = async (id: number, authType: 'adminer' | 'editor' | 'reader') => {
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