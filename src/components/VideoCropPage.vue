<template>
    <div class="cropPage">
        <div class="workRow">
            <div class="mediaCol">
                <div class="cropStage" v-if="inputFile != null">
                    <MediaDisplayer :src="inputFile.data" ref="media" :autoplay="true" :loop="true"></MediaDisplayer>
                    <div class="cadre" ref="cadre">
                        <div class="shade">
                            <div class="reticula" :style="{'left': cropX+'%', 'top': cropY+'%', 'width': cropW+'%', 'height': cropH+'%'}"></div>
                        </div>
                        <div v-for="c in corners" :key="c.name" class="slider" :style="{'left': (cropX + (c.right ? cropW : 0))+'%', 'top': (cropY + (c.bottom ? cropH : 0))+'%'}"
                            @pointerdown="grab" @pointermove="onDragCorner($event, c)" @pointerup="release" @pointercancel="release"></div>
                    </div>
                </div>
                <div v-else class="emptyHint">Load a video to begin</div>
            </div>
            <div class="monkCol">
                <MonkAnimation :converting="isConverting" :ready="inputFile != null" :muted="muted"></MonkAnimation>
            </div>
        </div>
        <div class="actionRow">
            <q-btn color="indigo-10" class="aoe-btn" glossy @click="crop" :disable="inputFile == null || isConverting" :loading="isConverting" label="Crop"></q-btn>
        </div>
        <div class="resultBox" v-if="resultFile !== null">
            <div class="aoe-success">Crop Succeded !</div>
            <q-btn type="a" glossy color="green" class="aoe-btn aoe-save" icon="save" label="Save" :href="resultFile.data" :download="resultFile.path.split('/').slice(-1)[0]"></q-btn>
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
.workRow {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: center;
}

.mediaCol {
    flex: 1 1 16rem;
    min-width: 0;
}

.monkCol {
    flex: 0 1 10rem;
}

.mediaCol {
    text-align: center;
}

.emptyHint {
    font-family: var(--aoe-font);
    font-size: 1.6rem;
    color: var(--aoe-gold);
    text-align: center;
    padding: 2rem 0.5rem;
    border: 2px dashed var(--aoe-gold-dark);
    border-radius: 6px;
}

/* Le cadre épouse exactement la zone utile du média (hors bordure décorative) */
.cropStage {
    position: relative;
    display: inline-block;
    max-width: 100%;
    line-height: 0;
}

.cadre {
    position: absolute;
    inset: var(--media-border);
}

/* Masque l'assombrissement qui déborde du cadre */
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

.actionRow {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}

.resultBox {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 2px groove var(--aoe-gold-dark);
}

.resultBox .aoe-save {
    max-width: 24rem;
}
</style>
