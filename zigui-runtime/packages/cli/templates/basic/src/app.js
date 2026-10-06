import { App, Screen, Column, Text, Button, signal } from "@zigui/ui";
const count=signal(0);
App(()=>Screen({background:"#f6f7f9",child:Column({padding:24,gap:12,children:[Text({text:"Hello ZigUI",fontSize:30}),Text({text:()=>`Count: ${count.value}`,fontSize:20}),Button({text:"Increment",onPress:()=>count.value++})]})}));
