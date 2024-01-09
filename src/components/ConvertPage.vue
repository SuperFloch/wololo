<template>
    <div class="p-relative">
        <div class="row convertLine">
            <div ref="input" class="col-4">
                <q-file filled v-model="currentFile" label="Add +" stack-label @update:model-value="addFile" bg-color="green" class="input"/>
                <MediaDisplayer :src="filePreviewSrc" :class="{'hidden' : currentFileSrc == ''}" ref="media" @load="onLoad"></MediaDisplayer>
            </div>
            <div ref="monk" class="col-4">
                <MonkAnimation :converting="isConverting" :ready="currentFileSrc != ''"></MonkAnimation>
            </div>
            <div ref="output" class="col-4">
                <div v-for="(i,k) in computeOutFormats" :key="k">
                    <q-btn  @click="convert(i)" color="green" glossy class="convertButton" :disabled="i == 'ico' && !isActiveIco">
                        {{ i }}
                    </q-btn>
                </div>
            </div>
        </div>
        <div class="row flex-center" v-show="resultUrl != null" transition-show="slide-down" transition-hide="fade">
            <div class="margin-auto">
                <img src="img/separator.png">
            </div>
        </div>
        <div class="row resultLine flex-center" v-show="resultUrl != null">
            <div class="col-2">
                <a class="q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--rectangle q-btn--actionable q-focusable q-hoverable glossy bg-green stretch" :href="resultUrl" :download="computeResultFileName">Download</a>
            </div>
        </div>
        <div class="errorToast" v-show="lastError != null">
            <div>Error</div>
            <div>{{ lastError }}</div>
        </div>
    </div>
</template>
<script>
import { defineComponent } from 'vue'
import MediaDisplayer from './MediaDisplayer.vue';
import MonkAnimation from './MonkAnimation.vue';
import { useQuasar } from 'quasar'

export default defineComponent({
    components: {
        MediaDisplayer,
        MonkAnimation
    },
    data: function(){
        return {
            currentFile: null,
            currentFileSrc:'',
            filePreviewSrc:'',
            isConverting: false,
            isActiveIco: false,
            resultUrl: null,
            resultExtension:'',
            lastError: null
        }
    },
    methods:{
        async addFile(){
            this.currentFileSrc = '';
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
                            this.toast(err.message);
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
                            this.toast(err.message);
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
                            this.toast(err.message);
                        });
                        break;
                    default:
                        this.isConverting = false;
                }
            }catch(error){
                this.isConverting = false;
                this.toast(error.message);
            }
        },
        onLoad(){
            var img = this.$refs.media.getFile()
            this.isActiveIco = img.width == img.height
        },
        stringToDataUrl(buffer,type){
            return 'data:' + type + ';base64,' + buffer;
        },
        toast(msg){
            this.lastError = msg;
            setTimeout(()=>{
                this.lastError = null;
            }, 5000)
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
                case 'gif':
                case 'webp':
                    return [
                        'webm'
                    ]
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
    padding: 2vh 3vw;
    text-align: center;
    text-transform: uppercase;
    font-size: 2em;
    font-weight: 800;
    width: 100%;
}
.errorToast{
    position: fixed;
    margin: auto;
    bottom: 5vh;
    left: 0;
    right: 0;
    text-align: center;
    background-color: red;
    width: 50%;
}

</style>