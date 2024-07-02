<template>
    <div class="p-relative">
        <div class="row convertLine">
            <div ref="input" class="col-10">
                <div class="head text-center">Remove the background of an image</div>
                <q-file filled v-model="currentFile" label="Load file" stack-label @update:model-value="addFile" label-color="white" class="input fileInput" accept="image/*"/>
                <MediaDisplayer :src="filePreviewSrc" :class="{'hidden' : currentFileSrc == ''}" ref="media" class="media"></MediaDisplayer>
            </div>
            <div ref="monk" class="col-2">
                <div class="monk">
                    <MonkAnimation :converting="isConverting" :ready="currentFileSrc != ''"></MonkAnimation>
                </div>
            </div>
        </div>
        <div class="row justify-center q-mt-md">
            <q-btn color="indigo-10" @click="convert" :disabled="currentFileSrc == ''" glossy>Remove Background</q-btn>
        </div>
        <div class="row resultLine flex-center" v-show="resultUrl != null">
            <div class="col-4"></div>
            <div class="col-4">
                <div class="downloadSuccessText">Removal Succeded !</div>
            </div>
            <div class="col-4">
                <img :src="resultUrl" :class="{'hidden' : resultUrl == null}">
            </div>
            <div class="col-12">
                <a class="q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--rectangle q-btn--actionable q-focusable q-hoverable glossy bg-green stretch" :href="resultUrl" :download="'result.png'">Save</a>
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
        async convert(){
            try{
                this.resultUrl = null;
                this.isConverting = true;
                window.ipcRenderer.invoke('img:remove-bg', {img: await this.currentFileSrc}).then((newPath)=>{
                    if(newPath){
                        this.currentFileSrc = '';
                        this.currentFile = null;
                        this.resultUrl = this.stringToDataUrl(newPath, 'image/png');
                    }
                    this.isConverting = false;
                })

            }catch(error){
                this.isConverting = false;
                this.$emit('error', error.message);
            }
        },
        stringToDataUrl(buffer,type){
            return 'data:' + type + ';base64,' + buffer;
        }
    }
})
</script>
<style scoped>
.head {
    color: rgb(11, 14, 87);
    font-size: 3em;
    font-family: 'Brush Script MT', cursive;
    text-shadow: 1px 1px 4px rgba(76, 58, 29, 0.5);
}
.downloadSuccessText{
    margin: auto;
    color: rgb(11, 87, 26);
    font-size: 5vh;
    font-family: 'Brush Script MT', cursive;
    text-shadow: 1px 1px 4px rgba(76, 58, 29, 0.5);
}
.media{
    max-width: 40vw;
    max-height: 50vh;
}
</style>