<template>
    <div class="historyBody aoe-panel">
        <div class="aoe-title historyTitle">Files</div>
        <q-file filled dense v-model="fileInputData" label="Load file" stack-label @update:model-value="addFile" class="aoe-input" />

        <!-- Seule zone defilante de l'application -->
        <div class="fileList">
            <div class="section" v-if="files.active?.data != null">
                <div class="aoe-subtitle">Active</div>
                <div class="activePreview">
                    <MediaDisplayer :src="files.active.data"></MediaDisplayer>
                </div>
            </div>

            <div class="section" v-for="group in groups" :key="group.key" v-show="files[group.key].length > 0">
                <div class="aoe-subtitle">{{ group.title }}</div>
                <div class="historyList">
                    <div class="historyRow" v-for="(f, i) in files[group.key]" :key="i">
                        <div class="thumbnail">
                            <MediaDisplayer :src="f.data"></MediaDisplayer>
                        </div>
                        <div class="fileInfo">
                            <div class="fileName" :title="fileName(f)">{{ fileName(f) }}</div>
                            <div class="buttons">
                                <q-btn round icon="image" color="blue" size="sm" glossy class="aoe-btn" @click="selectItem(f)" title="Use this file"></q-btn>
                                <q-btn round icon="download" color="green" size="sm" glossy class="aoe-btn" type="a" :href="f.data" :download="fileName(f)" title="Download"></q-btn>
                                <q-btn round icon="close" color="red" size="sm" glossy class="aoe-btn" @click="deleteItem(f)" title="Delete"></q-btn>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import MediaDisplayer from './MediaDisplayer.vue';
export default {
    components: { MediaDisplayer },
    emits: ['change'],
    data() {
        return {
            fileInputData: null,
            groups: [
                { key: 'input', title: 'Last inputs' },
                { key: 'output', title: 'Last outputs' }
            ],

            files: {
                active: null,
                input: [],
                output: []
            }
        }
    },
    methods: {
        async addFile() {
            this.files.active = null;

            const file = this.fileInputData;
            const data = await file.arrayBuffer();
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                this.files.active = { data: reader.result, path: '' };
            }, false);
            reader.readAsDataURL(file);

            var imgName = (new Date).getTime() + "." + file.name.split('.').slice(-1);
            window.ipcRenderer.invoke('img:upload', { path: imgName, buffer: data }).then((upPath) => {
                this.files.active.path = upPath;
                this.$emit('change', this.files.active)
            });
        },
        async loadHistory() {
            this.files.input = []
            this.files.output = []
            const history = await window.ipcRenderer.invoke('folder:read', '')
            history.forEach(async (filePath) => {
                if (filePath.split('/input/').length > 1) {
                    const fileData = await window.ipcRenderer.invoke('file:read', { path: filePath })
                    this.files.input.push({ path: filePath, data: fileData })
                }
                if (filePath.split('/output/').length > 1) {
                    const fileData = await window.ipcRenderer.invoke('file:read', { path: filePath })
                    this.files.output.push({ path: filePath, data: fileData })
                }
            })
        },
        fileName(f) {
            return f.path.split('/').slice(-1)[0]
        },
        selectItem(file) {
            this.files.active = file
            this.$emit('change', this.files.active)
        },
        deleteItem(file) {
            window.ipcRenderer.invoke('file:delete', file.path)
            this.loadHistory()
        }
    },
    mounted() {
        this.loadHistory()
    }
}
</script>
<style scoped>
.historyBody {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.6rem;
    min-height: 0;
}

.historyTitle {
    flex: 0 0 auto;
    margin: 0;
}

.fileList {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    padding-right: 4px;
}

.section {
    padding-top: 0.4rem;
    margin-top: 0.4rem;
    border-top: 2px groove var(--aoe-gold-dark);
}

.section:first-child {
    margin-top: 0;
    border-top: 0;
}

.activePreview {
    margin-top: 0.4rem;
    --media-max-h: 22vh;
}

.historyList {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
    gap: 0.4rem;
    margin-top: 0.4rem;
}

.historyRow {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem;
    min-width: 0;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(166, 143, 85, 0.5);
    border-radius: 4px;
}

.historyRow .thumbnail {
    flex: 0 0 3.6rem;
    height: 3.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    --media-border: 4px;
    --media-max-h: 3.6rem;
}

.historyRow .thumbnail :deep(.media) {
    max-width: 3.6rem;
}

.fileInfo {
    flex: 1 1 0;
    min-width: 0;
}

.fileName {
    color: #fff;
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.buttons {
    display: flex;
    gap: 0.3rem;
    margin-top: 0.25rem;
}
</style>
