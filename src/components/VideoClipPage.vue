<template>
    <div class="p-relative">
        <div class="row convertLine">
            <div ref="input" class="col-12">
                <q-file filled v-model="currentFile" label="Load file" stack-label @update:model-value="addFile" label-color="white" class="input fileInput" accept="video/*"/>
                <div class="row">
                    <div class="media col-10">
                        <MediaDisplayer :src="filePreviewSrc" :class="{ 'hidden': currentFileSrc == '' }" ref="media" :autoplay="false" :loop="true" :start="start" :end="end"></MediaDisplayer>
                    </div>
                    <div class="col-2">
                        <MonkAnimation :converting="isConverting" :ready="currentFileSrc != ''"></MonkAnimation>
                    </div>
                </div>
            </div>
        </div>
        <div>
            <div class="gauge" ref="gauge" v-show="currentFileSrc != ''">
                <div class="bar" :style="{'left': start+'%', 'width': (end-start)+'%'}"></div>
                <div ref="slideStart" class="slider" :style="{'left': start+'%'}" @drag="onDragStart"></div>
                <div ref="slideEnd" class="slider" :style="{'left': end+'%'}" @drag="onDragEnd"></div>
            </div>
        </div>
        <div class="row q-mt-md justify-center">
            <div class="col-8">
                <q-btn color="indigo-10 w-100" glossy @click="clip" :disabled="currentFileSrc === ''">Clip</q-btn>
            </div>
        </div>
        <div class="row" v-show="resultUrl !== null">
            <div class="downloadSuccessText">Clip Succeded !</div>
            <a class="q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--rectangle q-btn--actionable q-focusable q-hoverable glossy bg-indigo-10 stretch" :href="resultUrl" :download="'result.'+outFormat">Save</a>
        </div>
    </div>
</template>
<script>
import MediaDisplayer from './MediaDisplayer.vue';
import MonkAnimation from './MonkAnimation.vue';
export default {
    data: function(){
        return {
            currentFile: null,
            currentFileSrc:'',
            filePreviewSrc:'',
            isConverting: false,
            resultUrl: null,
            start: 0,
            end: 100,
            outFormat: ''
        }
    },
    emits:['error'],
    components:{
        MediaDisplayer,
        MonkAnimation
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
            this.outFormat = file.name.split('.').slice(-1)
            var imgName = "input_"+Math.floor(Math.random() * 500) + "." + file.name.split('.').slice(-1);
            window.ipcRenderer.invoke('img:upload', {path: imgName, buffer: data}).then((upPath)=>{
                this.currentFileSrc = upPath;
            });
        },
        onDragStart(e){
            if(e.clientX > 0){
                const rect = this.$refs.gauge.getBoundingClientRect()
                const x = (e.clientX - rect.left) / rect.width * 100
                if(x < this.end && x > 0){
                    this.start = x
                    this.$refs.media.setTime(x)
                }
            }
        },
        onDragEnd(e){
            if(e.clientX > 0){
                const rect = this.$refs.gauge.getBoundingClientRect()
                const x = (e.clientX - rect.left) / rect.width * 100
                if(x > this.start && x < 100){
                    this.end = x
                    this.$refs.media.setTime(x)
                }
            }
        },
        async clip(){
            this.isConverting = true
            const startTime = this.start / 100 * this.$refs.media.getDuration()
            const duration =  Math.abs(startTime - this.end / 100 * this.$refs.media.getDuration())
            window.ipcRenderer.invoke('video:clip', {video: this.currentFileSrc, startTime, duration}).then((newPath)=>{
                if(newPath){
                    this.currentFileSrc = '';
                    this.currentFile = null;
                    this.resultUrl = this.stringToDataUrl(newPath, 'video/' + this.outFormat);
                }
                this.isConverting = false;
            }).catch(err =>{
                this.isConverting = false;
                console.log(err.message)
                this.$emit('error', err.message);
            });
        },
        stringToDataUrl(buffer,type){
            return 'data:' + type + ';base64,' + buffer;
        }
    }
}
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
.fileInput{
    background: radial-gradient(circle, rgba(230,197,101,1) 0%, rgba(166,143,85,1) 100%);
    border: 4mm ridge rgba(60, 83, 146, 0.733);
}
.fileInput :deep(.q-field__label) {
    font-size: 2em;
    height: 100%;
    font-family: 'Brush Script MT', cursive;
}
.media{
    margin: auto;
    max-height: 60vh;
}
.gauge{
    margin: auto;
    background: linear-gradient(180deg, rgb(114, 114, 114) 17%, rgb(185, 185, 185) 55%, rgb(139, 138, 138) 100%);
    width: 80%;
    height: 1vh;
    position: relative;
    border-radius: 1vh;
}
.slider{
    position: absolute;
    width: 2vh;
    height: 2vh;
    margin: auto;
    top: 0;
    bottom: 0;
    background: radial-gradient(circle, rgba(230,197,101,1) 0%, rgb(95, 81, 44) 100%);
    border-radius: 100%;
    cursor: pointer;
}
.downloadSuccessText{
    margin: auto;
    color: rgb(11, 87, 26);
    font-size: 5em;
    font-family: 'Brush Script MT', cursive;
    text-shadow: 1px 1px 4px rgba(76, 58, 29, 0.5);
}
.bar{
    position: absolute;
    margin: auto;
    top:0;
    bottom: 0;
    height: 100%;
    background: linear-gradient(180deg, rgb(66, 166, 200) 17%, rgb(58, 70, 249) 55%, rgb(66, 166, 200) 100%);
}
</style>