<template>
    <div class="removeBgPage">
        <div class="aoe-title">Remove the background of an image</div>
        <div class="workRow">
            <div class="mediaCol">
                <MediaDisplayer :src="inputFile.data" v-if="inputFile != null" ref="media"></MediaDisplayer>
                <div v-else class="emptyHint">Load an image to begin</div>
            </div>
            <div class="monkCol">
                <MonkAnimation :converting="isConverting" :ready="inputFile != null" :muted="muted"></MonkAnimation>
            </div>
        </div>
        <div class="actionRow">
            <q-btn color="indigo-10" class="aoe-btn" @click="convert" :disable="inputFile == null || isConverting" :loading="isConverting" glossy label="Remove Background"></q-btn>
        </div>
        <div class="resultBox" v-if="resultFile != null">
            <div class="aoe-success">Removal Succeded !</div>
            <div class="resultImg"><img :src="resultFile.data" alt="Result"></div>
            <q-btn type="a" glossy color="green" class="aoe-btn aoe-save" icon="save" label="Save" :href="resultFile.data" :download="'result.png'"></q-btn>
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
    props:{
        muted: Boolean,
        inputFile: {
            type: Object,
            default: () =>{ return null}
        }
    },
    emits:['error', 'output'],
    data: function(){
        return {
            isConverting: false,
            resultFile: null
        }
    },
    methods:{
        convert(){
            this.resultFile = null;
            this.isConverting = true;
            window.ipcRenderer.invoke('img:remove-bg', {img:this.inputFile.path}).then((result)=>{
                if(result.error){
                    this.$emit('error', result.error)
                }else{
                    this.resultFile = result
                    this.$emit('output')
                }
            }).catch(err => {
                this.$emit('error', err.message);
            }).finally(() => {
                this.isConverting = false;
            })
        }
    }
})
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

.emptyHint {
    font-family: var(--aoe-font);
    font-size: 1.6rem;
    color: var(--aoe-gold);
    text-align: center;
    padding: 2rem 0.5rem;
    border: 2px dashed var(--aoe-gold-dark);
    border-radius: 6px;
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

.resultImg {
    max-width: 100%;
    padding: 0.5rem;
    border: 2px ridge var(--aoe-gold-dark);
    border-radius: 4px;
    /* damier pour visualiser la transparence */
    background: repeating-conic-gradient(#555 0% 25%, #888 0% 50%) 50% / 20px 20px;
}

.resultImg img {
    display: block;
    max-height: 50vh;
}
</style>
