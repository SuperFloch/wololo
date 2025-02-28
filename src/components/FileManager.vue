<template>
    <div class="historyBody">
        <div class="historyTitle">Files</div>
        <div>
            <q-file filled v-model="fileInputData" label="Load file" stack-label @update:model-value="addFile" label-color="white" class="input fileInput" />
        </div>
        <hr>
        <div>
            <div class="sectionTitle">Active</div>
            <MediaDisplayer v-if="files.active?.data != null" :src="files.active?.data"></MediaDisplayer>
        </div>
        <hr>
        <div v-show="files.input.length > 0">
            <div class="sectionTitle">Last inputs</div>
            <div class="historyRow" v-for="(f, i) in files.input" :key="i">
                <div class="thumbnail">
                    <MediaDisplayer :src="f.data"></MediaDisplayer>
                </div>

                <div>
                    <div class="text-white">{{ f.path.split('/').slice(-1)[0] }}</div>
                    <div class="buttons">

                        <q-btn round icon="image" color="blue" size="sm" glossy @click="selectItem(f)"></q-btn>
                        <a class="dl-butt q-btn q-btn-item non-selectable no-outline q-btn--standard bg-green q-btn--round text-white q-btn--actionable q-focusable q-hoverable glossy" :href="f.data" :download="f.path.split('/').slice(-1)[0]">
                            <span class="q-focus-helper"></span>
                            <span class="stretch q-btn__content text-center col items-center q-anchor--skip justify-center row">
                                <i class="q-icon notranslate material-icons" aria-hidden="true" role="img">download</i>
                            </span>
                        </a>
                        <q-btn round icon="close" color="red" size="sm" glossy @click="deleteItem(f)"></q-btn>
                    </div>
                </div>
            </div>
        </div>
        <hr>
        <div v-show="files.output.length > 0">
            <div class="sectionTitle">Last outputs</div>
            <div class="historyRow" v-for="(f, i) in files.output" :key="i">
                <div class="thumbnail">
                    <MediaDisplayer :src="f.data"></MediaDisplayer>
                </div>
                <div>
                    <div class="text-white">{{ f.path.split('/').slice(-1)[0] }}</div>
                    <div class="buttons">
                        <q-btn round icon="image" color="blue" size="sm" glossy @click="selectItem(f)"></q-btn>
                        <a class="dl-butt q-btn q-btn-item non-selectable no-outline q-btn--standard bg-green q-btn--round text-white q-btn--actionable q-focusable q-hoverable glossy" :href="f.data" :download="f.path.split('/').slice(-1)[0]">
                            <span class="q-focus-helper"></span>
                            <span class="stretch q-btn__content text-center col items-center q-anchor--skip justify-center row">
                                <i class="q-icon notranslate material-icons" aria-hidden="true" role="img">download</i>
                            </span>
                        </a>
                        <q-btn round icon="close" color="red" size="sm" glossy @click="deleteItem(f)"></q-btn>
                    </div>
                </div>
            </div>
        </div>
        <hr>
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
    width: 100%;
    background-color: rgba(0, 0, 0, 0.5);
}

.historyTitle {
    color: white;
    font-family: 'Brush Script MT', cursive;
    font-size: 4vh;
}

.sectionTitle {
    color: white;
    font-family: 'Brush Script MT', cursive;
    font-size: 3vh;
}

.historyRow {
    height: 7vh;
    display: flex;
    justify-content: flex-start;
}

.historyRow .thumbnail {
    width: 50%;
}

.historyRow .buttons {
    height: fit-content;
    margin: auto;
}
.historyRow .buttons span{
    font-size: 1vh !important;
}
.historyRow .text-white{
    font-size: 1vh;
}
.q-btn--round {
    height: 4vh;
    min-height: 0;
    min-width: 0;
    aspect-ratio: 1/1;
}

.dl-butt {
    overflow: hidden;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12);
    background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.12) 51%, rgba(0, 0, 0, 0.04)) !important;
}
</style>