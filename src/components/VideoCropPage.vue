<template>
    <div class="aoe-page">
        <div class="aoe-work">
            <div class="aoe-media">
                <MediaDisplayer v-if="inputFile != null" :src="inputFile.data" ref="media" fit :autoplay="true" :loop="true">
                    <div class="cadre" ref="cadre">
                        <div class="shade">
                            <div class="reticula" :style="{'left': cropX+'%', 'top': cropY+'%', 'width': cropW+'%', 'height': cropH+'%'}"></div>
                        </div>
                        <div v-for="c in corners" :key="c.name" class="slider" :style="{'left': (cropX + (c.right ? cropW : 0))+'%', 'top': (cropY + (c.bottom ? cropH : 0))+'%'}"
                            @pointerdown="grab" @pointermove="onDragCorner($event, c)" @pointerup="release" @pointercancel="release"></div>
                    </div>
                </MediaDisplayer>
                <div v-else class="aoe-empty">Load a video to begin</div>
            </div>
            <div class="aoe-monk">
                <MonkAnimation :converting="isConverting" :ready="inputFile != null" :muted="muted"></MonkAnimation>
            </div>
        </div>
        <div class="aoe-actions">
            <q-btn color="indigo-10" class="aoe-btn" glossy @click="crop" :disable="inputFile == null || isConverting" :loading="isConverting" label="Crop"></q-btn>
            <template v-if="resultFile !== null">
                <div class="aoe-success">Crop Succeded !</div>
                <q-btn type="a" glossy color="green" class="aoe-btn aoe-save" icon="save" label="Save" :href="resultFile.data" :download="resultFile.path.split('/').slice(-1)[0]"></q-btn>
            </template>
        </div>
    </div>
</template>
<script>
import MediaDisplayer from './MediaDisplayer.vue';
import MonkAnimation from './MonkAnimation.vue';

// Taille minimale du cadre de recadrage, en % de l'image
const MIN_CROP = 5

export default {
    data: function(){
        return {
            isConverting: false,
            cropX: 25,
            cropY: 25,
            cropW: 50,
            cropH: 50,
            corners: [
                { name: 'tl', right: false, bottom: false },
                { name: 'tr', right: true, bottom: false },
                { name: 'bl', right: false, bottom: true },
                { name: 'br', right: true, bottom: true }
            ],
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
    emits:['error', 'output'],
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
                this.$emit('error', err.message);
            });
        },
        grab(e){
            e.currentTarget.setPointerCapture(e.pointerId)
        },
        release(e){
            if(e.currentTarget.hasPointerCapture(e.pointerId)){
                e.currentTarget.releasePointerCapture(e.pointerId)
            }
        },
        // Déplace un coin du cadre (corner.right / corner.bottom indiquent le coin concerné)
        onDragCorner(e, corner){
            if(!e.currentTarget.hasPointerCapture(e.pointerId)) return
            const rect = this.$refs.cadre.getBoundingClientRect()
            const x = Math.min(Math.max((e.clientX - rect.left) / rect.width * 100, 0), 100)
            const y = Math.min(Math.max((e.clientY - rect.top) / rect.height * 100, 0), 100)
            if(corner.right){
                this.cropW = Math.max(x, this.cropX + MIN_CROP) - this.cropX
            }else{
                const newX = Math.min(x, this.cropX + this.cropW - MIN_CROP)
                this.cropW += this.cropX - newX
                this.cropX = newX
            }
            if(corner.bottom){
                this.cropH = Math.max(y, this.cropY + MIN_CROP) - this.cropY
            }else{
                const newY = Math.min(y, this.cropY + this.cropH - MIN_CROP)
                this.cropH += this.cropY - newY
                this.cropY = newY
            }
        }
    }
}
</script>
<style scoped>
.cadre {
    position: absolute;
    inset: 0;
}

/* Masque l'assombrissement qui deborde du cadre */
.shade {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
}

.reticula {
    position: absolute;
    outline: solid 2px rgb(85, 255, 241);
    box-shadow: 0px 0px 0px 5000px rgba(0, 0, 0, 0.5);
}

.slider {
    position: absolute;
    width: 22px;
    height: 22px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(230, 197, 101, 1) 0%, rgb(95, 81, 44) 100%);
    border: 2px solid var(--aoe-gold-dark);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
    cursor: grab;
    touch-action: none;
}
</style>
