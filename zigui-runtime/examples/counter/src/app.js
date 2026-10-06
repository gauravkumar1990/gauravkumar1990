import {App,Screen,Column,Row,Text,Button,signal} from "@zigui/ui";
const n=signal(0);
App(()=>Screen({child:Column({padding:32,gap:16,children:[Text({text:"ZigUI Counter",fontSize:34}),Text({text:()=>`Value ${n.value}`,fontSize:24}),Row({gap:10,children:[Button({text:"-",onPress:()=>n.value--}),Button({text:"+",onPress:()=>n.value++})]})]})}));
