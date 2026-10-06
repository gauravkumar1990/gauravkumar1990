package dev.zigui.runtime
import android.content.Context
import android.widget.*
object ViewFactory{
 fun text(c:Context,text:String)=TextView(c).apply{this.text=text}
 fun button(c:Context,text:String)=Button(c).apply{this.text=text}
 fun input(c:Context,hint:String)=EditText(c).apply{this.hint=hint}
 fun column(c:Context)=LinearLayout(c).apply{orientation=LinearLayout.VERTICAL}
 fun row(c:Context)=LinearLayout(c).apply{orientation=LinearLayout.HORIZONTAL}
 fun scroll(c:Context)=ScrollView(c)
 fun image(c:Context)=ImageView(c)
 fun progress(c:Context)=ProgressBar(c)
 fun toggle(c:Context)=Switch(c)
}
