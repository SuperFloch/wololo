<template>
    <div class="p-relative">
        <div class="row convertLine">
            <div ref="input" class="col-4">
                <q-file filled v-model="currentFile" label="Load file" stack-label @update:model-value="addFile" label-color="white" class="input fileInput"/>
                <MediaDisplayer :src="filePreviewSrc" :class="{'hidden' : currentFileSrc == ''}" ref="media" @load="onLoad"></MediaDisplayer>
            </div>
            <div ref="monk" class="col-4">
                <div class="monk">
                    <MonkAnimation :converting="isConverting" :ready="currentFileSrc != ''"></MonkAnimation>
                </div>
                <div class="row resultLine flex-center" v-show="resultUrl != null">
                    <div class="downloadSuccessText">Conversion Succeded !</div>
                    <div class="col-12">
                        <a class="q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--rectangle q-btn--actionable q-focusable q-hoverable glossy bg-green stretch" :href="resultUrl" :download="computeResultFileName">Save</a>
                    </div>
                </div>
            </div>
            <div ref="output" class="col-4 p-relative">
                <div class="p-relative convertButtonList">
                    <img src="img/parcheminBg.png" class="parchemin w-100">
                    <div class="listContainer">
                        <div class="listTitle">Output formats</div>
                        <div v-for="(i,k) in computeOutFormats" :key="k">
                            <q-btn  @click="convert(i)" color="brown" glossy class="convertButton" :disabled="i == 'ico' && !isActiveIco">
                                {{ i }}
                            </q-btn>
                        </div>
                    </div>
                </div>
                <img src="img/parcheminBot.png" class="w-100 parcheminBot">
            </div>
        </div>
    </div>
</template>
<script>
import { defineComponent } from 'vue'
import MediaDisplayer from './MediaDisplayer.vue';
import MonkAnimation from './MonkAnimation.vue';

export default defineComponent({
    components: {
        MediaDisplayer,
        MonkAnimation
    },
    emits:['error'],
    data: function(){
        return {
            currentFile: null,
            currentFileSrc:'',
            filePreviewSrc:'',
            isConverting: false,
            isActiveIco: false,
            resultUrl: null,
            resultExtension:''
        }
    },
    methods:{
        async addFile(){
            this.currentFileSrc = '';
            this.resultUrl = null;
            const file = this.currentFile;
            const data = await file.arrayBuffer();
            const reader = new FileReader();
            reader.addEventListener('load',()=>{
                this.filePreviewSrc = reader.result;
            }, false);
            reader.readAsDataURL(file);
            var imgName = "input_"+Math.floor(Math.random() * 500) + "." + file.name.split('.').slice(-1);
            window.ipcRenderer.invoke('img:upload', {path: imgName, buffer: data}).then((upPath)=>{
                this.currentFileSrc = upPath;
            });
        },
        convert(format){
            try{
                this.resultUrl = null;
                this.isConverting = true;
                switch(format){
                    case 'webp':
                        window.ipcRenderer.invoke('img:convert:webp', {img: this.currentFileSrc}).then((newPath)=>{
                            if(newPath){
                                this.currentFileSrc = '';
                                this.currentFile = null;
                                this.resultUrl = this.stringToDataUrl(newPath, 'image/webp');
                                this.resultExtension = 'webp';
                            }
                            this.isConverting = false;
                        }).catch(err =>{
                            this.isConverting = false;
                            this.$emit('error', err.message);
                        });
                        break;
                    case 'webm':
                        window.ipcRenderer.invoke('img:convert:webm', {img: this.currentFileSrc}).then((newPath)=>{
                            if(newPath){
                                this.currentFileSrc = '';
                                this.currentFile = null;
                                this.resultUrl = this.stringToDataUrl(newPath, 'video/webm');
                                this.resultExtension = 'webm';
                            }
                            this.isConverting = false;
                        }).catch(err =>{
                            this.isConverting = false;
                            this.$emit('error', err.message);
                        });
                        break;
                    case 'ico':
                        window.ipcRenderer.invoke('img:convert:ico', {img: this.currentFileSrc}).then((newPath)=>{
                            if(newPath){
                                this.currentFileSrc = '';
                                this.currentFile = null;
                                this.resultUrl = this.stringToDataUrl(newPath, 'image/ico');
                                this.resultExtension = 'ico';
                            }
                            this.isConverting = false;
                        }).catch(err =>{
                            this.isConverting = false;
                            this.$emit('error', err.message);
                        });
                        break;
                    case 'gif':
                        window.ipcRenderer.invoke('img:convert:gif', {img: this.currentFileSrc}).then((newPath)=>{
                            if(newPath){
                                this.currentFileSrc = '';
                                this.currentFile = null;
                                this.resultUrl = this.stringToDataUrl(newPath, 'image/gif');
                                this.resultExtension = 'gif';
                            }
                            this.isConverting = false;
                        }).catch(err =>{
                            this.isConverting = false;
                            this.$emit('error', err.message);
                        });
                        break;
                    default:
                        this.isConverting = false;
                }
            }catch(error){
                this.isConverting = false;
                this.$emit('error', err.message);
            }
        },
        onLoad(){
            this.isActiveIco = this.$refs.media.isSquare()
        },
        stringToDataUrl(buffer,type){
            return 'data:' + type + ';base64,' + buffer;
        }
    },
    computed: {
        computeOutFormats(){
            if(this.currentFileSrc == '') return [];
            switch(this.currentFileSrc.split('.').slice(-1)[0]){
                case 'jpg':
                return [
                    'webp'
                ]
                case 'png':
                    return [
                        'webp',
                        'ico'
                    ]
                case 'mov':
                case 'avi':
                case 'mp4':
                case 'gif':
                case 'webp':
                    return [
                        'webm'
                    ]
                case 'webm':
                    return ['gif']
            }
        },
        computeResultFileName(){
            return 'result.'+this.resultExtension;
        }
    }
})
</script>
<style scoped>
.convertLine{
    min-height: 30vh;
    background-color: transparent;
}
.convertButton{
    text-align: center;
    text-transform: uppercase;
    font-size: 2em;
    font-weight: 800;
    margin: 1vh auto;
    width: 50%;
}
.monk{
    height: 35vh;
    width: 100%;
}
.fileInput{
    background: radial-gradient(circle, rgba(230,197,101,1) 0%, rgba(166,143,85,1) 100%);
    border: 4mm ridge rgba(60, 83, 146, 0.733);
}
.fileInput :deep(.q-field__label) {
    font-size: 2em;
    height: 100%;
    font-family: 'Brush Script MT', cursive;
}
.convertButtonList{
    padding: 8vh 2vw 3vh 2vw;
    overflow: hidden;
}
.listContainer{
    overflow: hidden;
    height: fit-content;
    text-align: center;
}
.listTitle{
    position: relative;
    font-size: 5vh;
    position: relative;
    color:rgba(16, 41, 111, 0.58);
    font-family: 'Brush Script MT', cursive;
}
.parcheminBot{
    margin-top: -2vh;
    z-index: 5;
    position: relative;
}
.parchemin{
    width: 100%;
    position: absolute;
    top: 0vh;
    margin: auto;
    left: 0;
    right: 0;
}
.downloadSuccessText{
    margin: auto;
    color: rgb(11, 87, 26);
    font-size: 5vh;
    font-family: 'Brush Script MT', cursive;
    text-shadow: 1px 1px 4px rgba(76, 58, 29, 0.5);
}

</style>