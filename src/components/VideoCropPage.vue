<template>
    <div class="p-relative">
        <div class="row convertLine">
            <div ref="input" class="col-12">
                <q-file filled v-model="currentFile" label="Load file" stack-label @update:model-value="addFile" label-color="white" class="input fileInput" accept="video/*"/>
                <div class="row">
                    <div class="media col-10 p-relative">
                        <MediaDisplayer :src="filePreviewSrc" :class="{ 'hidden': currentFileSrc == '' }" ref="media" :autoplay="true" :loop="true"></MediaDisplayer>
                        <div class="cadre absolute-center" ref="cadre">
                            <div class="reticula" :style="{'left': cropX+'%', 'top': cropY+'%', 'width': cropW+'%', 'height': cropH+'%'}"></div>

                            <div class="slider" :style="{'left': cropX+'%', 'top': cropY+'%'}" @drag="onDragCornerTopLeft"></div>
                            <div class="slider" :style="{'left': (cropX+cropW)+'%', 'top': cropY+'%'}" @drag=onDragCornerTopRight></div>
                            <div class="slider" :style="{'left': cropX+'%', 'top': (cropY+cropH)+'%'}" @drag="onDragCornerBottomLeft"></div>
                            <div class="slider" :style="{'left': (cropX+cropW)+'%', 'top': (cropY+cropH)+'%'}" @drag="onDragCornerBottomRight"></div>
                        </div>
                    </div>
                    <div class="col-2">
                        <MonkAnimation :converting="isConverting" :ready="currentFileSrc != ''" :muted="muted"></MonkAnimation>
                    </div>
                </div>
            </div>
        </div>
        <div class="row q-mt-md justify-center">
            <div class="col-8">
                <q-btn color="indigo-10 w-100" glossy @click="crop" :disable="currentFileSrc == ''">Crop</q-btn>
            </div>
        </div>
        <div class="row" v-show="resultUrl !== null">
            <div class="downloadSuccessText">Crop Succeded !</div>
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
            outFormat: '',
            cropX: 25,
            cropY: 25,
            cropW: 50,
            cropH: 50
        }
    },
    props:{
        muted: Boolean
    },
    components:{
        MediaDisplayer,
        MonkAnimation
    },
    emits:['error'],
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
        crop(){
            this.isConverting = true
            const rect = {width: this.$refs.media.width, height: this.$refs.media.height}
            const x = Math.floor(this.cropX / 100 * rect.width);
            const y = Math.floor(this.cropY / 100 * rect.height);
            const w = Math.floor(this.cropW / 100 * rect.width);
            const h = Math.floor(this.cropH / 100 * rect.height);
            window.ipcRenderer.invoke('video:crop', {video: this.currentFileSrc, x, y, w, h}).then((newPath)=>{
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
        onDragCornerTopLeft(e){
            if(e.clientX > 0 && e.clientY > 0){
                const rect = this.$refs.cadre.getBoundingClientRect()
                const x = (e.clientX - rect.left) / rect.width * 100
                const y = (e.clientY - rect.top) / rect.height * 100
                if(x >= 0 && x <= 100){
                    this.cropW += this.cropX - x
                    this.cropX = x
                }
                if(y >= 0 && y <= 100){
                    this.cropH += this.cropY - y
                    this.cropY = y
                }
            }
        },
        onDragCornerTopRight(e){
            if(e.clientX > 0 && e.clientY > 0){
                const rect = this.$refs.cadre.getBoundingClientRect()
                const x = (e.clientX - rect.left) / rect.width * 100
                const y = (e.clientY - rect.top) / rect.height * 100
                if(x >= 0 && x <= 100){
                    this.cropW = x - this.cropX 
                }
                if(y >= 0 && y <= 100){
                    this.cropH += this.cropY - y
                    this.cropY = y
                }
            }
        },
        onDragCornerBottomLeft(e){
            if(e.clientX > 0 && e.clientY > 0){
                const rect = this.$refs.cadre.getBoundingClientRect()
                const x = (e.clientX - rect.left) / rect.width * 100
                const y = (e.clientY - rect.top) / rect.height * 100
                if(x >= 0 && x <= 100){
                    this.cropW += this.cropX - x
                    this.cropX = x
                }
                if(y >= 0 && y <= 100){
                    this.cropH = y - this.cropY
                }
            }
        },
        onDragCornerBottomRight(e){
            if(e.clientX > 0 && e.clientY > 0){
                const rect = this.$refs.cadre.getBoundingClientRect()
                const x = (e.clientX - rect.left) / rect.width * 100
                const y = (e.clientY - rect.top) / rect.height * 100
                if(x >= 0 && x <= 100){
                    this.cropW = x - this.cropX
                }
                if(y >= 0 && y <= 100){
                    this.cropH = y - this.cropY
                }
            }
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
    width: fit-content;
    margin: auto;
}
.cadre{
    transform: none;
    margin: 30px;
    overflow: hidden;
}
.reticula{
    position: absolute;
    outline: solid 2px rgb(85, 255, 241);
    box-shadow: 0px 0px 0px 5000px rgba(0, 0, 0, 0.5);
}
.slider{
    position: absolute;
    width: 2vh;
    height: 2vh;
    margin: auto;
    background: radial-gradient(circle, rgba(230,197,101,1) 0%, rgb(95, 81, 44) 100%);
    border-radius: 100%;
    cursor: pointer;
    transform: translate(-50%, -50%);
}
.downloadSuccessText{
    margin: auto;
    color: rgb(11, 87, 26);
    font-size: 5em;
    font-family: 'Brush Script MT', cursive;
    text-shadow: 1px 1px 4px rgba(76, 58, 29, 0.5);
}
</style>