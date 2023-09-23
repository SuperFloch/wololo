<template>
    <div>
        <div ref="input">
            <q-file filled v-model="currentFileAdd" label="Add +" stack-label @update:model-value="addFile"/>
        </div>
        <div ref="monk"></div>
        <div ref="output"></div>
    </div>
</template>
<script>
import { defineComponent } from 'vue'

export default defineComponent({
    data: function(){
        return {
            currentFileAdd: null
        }
    },
    methods:{
        async addFile(){
            const file = this.currentFileAdd;
            const data = await file.arrayBuffer();
            var imgName = "input_"+Math.floor(Math.random() * 500) + "." + file.name.split('.').slice(-1);
            window.ipcRenderer.send('img:upload', {path: "workspace/input/"+imgName, buffer: data});
        }
    }
})
</script>