package dev.zigui.runtime
import android.app.Activity
import android.view.ViewGroup
object NativeRuntime{init{runCatching{System.loadLibrary("zigui")}}external fun nativeStart(activity:Activity,root:ViewGroup);fun start(activity:Activity,root:ViewGroup){try{nativeStart(activity,root)}catch(_:UnsatisfiedLinkError){root.addView(ViewFactory.text(activity,"ZigUI native library not built yet"))}}}
