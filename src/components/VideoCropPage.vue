<template>
    <div class="p-relative">
        <div class="row convertLine">
            <div ref="input" class="col-12">
                <div class="row">
                    <div class="media col-10 p-relative">
                        <MediaDisplayer :src="inputFile.data" v-if="inputFile != null" ref="media" :autoplay="true" :loop="true"></MediaDisplayer>
                        <div class="cadre absolute-center" ref="cadre">
                            <div class="reticula" :style="{'left': cropX+'%', 'top': cropY+'%', 'width': cropW+'%', 'height': cropH+'%'}"></div>

                            <div class="slider" :style="{'left': cropX+'%', 'top': cropY+'%'}" @drag="onDragCornerTopLeft"></div>
                            <div class="slider" :style="{'left': (cropX+cropW)+'%', 'top': cropY+'%'}" @drag=onDragCornerTopRight></div>
                            <div class="slider" :style="{'left': cropX+'%', 'top': (cropY+cropH)+'%'}" @drag="onDragCornerBottomLeft"></div>
                            <div class="slider" :style="{'left': (cropX+cropW)+'%', 'top': (cropY+cropH)+'%'}" @drag="onDragCornerBottomRight"></div>
                        </div>
                    </div>
                    <div class="col-2">
                        <MonkAnimation :converting="isConverting" :ready="inputFile != null" :muted="muted"></MonkAnimation>
                    </div>
                </div>
            </div>
        </div>
        <div class="row q-mt-md justify-center">
            <div class="col-8">
                <q-btn color="indigo-10 w-100" glossy @click="crop" :disable="inputFile == null">Crop</q-btn>
            </div>
        </div>
        <div class="row" v-if="resultFile !== null">
            <div class="downloadSuccessText">Crop Succeded !</div>
            <a class="q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--rectangle q-btn--actionable q-focusable q-hoverable glossy bg-indigo-10 stretch" :href="resultFile.data" :download="resultFile.path.split('/').slice(-1)[0]">Save</a>
        </div>
    </div>
</template>
<script>
import MediaDisplayer from './MediaDisplayer.vue';
import MonkAnimation from './MonkAnimation.vue';
export default {
    data: function(){
        return {
            isConverting: false,
            cropX: 25,
            cropY: 25,
            cropW: 50,
            cropH: 50,
            resultFile: null
        }
    },
    props:{
        muted: Boolean,
        inputFile: {
            type: Object,
            default: () =>{ return null}
        }
    },
    components:{
        MediaDisplayer,
        MonkAnimation
    },
    emits:['error'],
    methods:{
        crop(){
            this.isConverting = true
            this.resultFile = null
            const rect = {width: this.$refs.media.width, height: this.$refs.media.height}
            const x = Math.floor(this.cropX / 100 * rect.width);
            const y = Math.floor(this.cropY / 100 * rect.height);
            const w = Math.floor(this.cropW / 100 * rect.width);
            const h = Math.floor(this.cropH / 100 * rect.height);
            window.ipcRenderer.invoke('video:crop', {video: this.inputFile.path, x, y, w, h}).then((result)=>{
                if(result.error){
                    this.$emit('error', result.error);
                }else{
                    this.resultFile = result;
                    this.$emit('output')
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