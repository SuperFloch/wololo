<template>
    <div class="aoe-page">
        <div class="aoe-title">Remove the background of an image</div>
        <div class="aoe-work">
            <div class="aoe-media">
                <MediaDisplayer :src="inputFile.data" v-if="inputFile != null" ref="media" fit></MediaDisplayer>
                <div v-else class="aoe-empty">Load an image to begin</div>
            </div>
            <div class="aoe-monk">
                <MonkAnimation :converting="isConverting" :ready="inputFile != null" :muted="muted"></MonkAnimation>
            </div>
            <div class="aoe-media resultArea" v-if="resultFile != null">
                <MediaDisplayer :src="resultFile.data" fit></MediaDisplayer>
            </div>
        </div>
        <div class="aoe-actions">
            <q-btn color="indigo-10" class="aoe-btn" @click="convert" :disable="inputFile == null || isConverting" :loading="isConverting" glossy label="Remove Background"></q-btn>
            <template v-if="resultFile != null">
                <div class="aoe-success">Removal Succeded !</div>
                <q-btn type="a" glossy color="green" class="aoe-btn aoe-save" icon="save" label="Save" :href="resultFile.data" :download="'result.png'"></q-btn>
            </template>
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
/* Damier pour visualiser la transparence du resultat */
.resultArea {
    background: repeating-conic-gradient(#555 0% 25%, #888 0% 50%) 50% / 20px 20px;
    border-radius: 6px;
}
</style>
