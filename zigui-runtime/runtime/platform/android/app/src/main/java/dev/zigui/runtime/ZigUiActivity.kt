package dev.zigui.runtime
import android.app.Activity
import android.os.Bundle
import android.widget.FrameLayout
class ZigUiActivity:Activity(){private lateinit var root:FrameLayout;override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);root=FrameLayout(this);setContentView(root);NativeRuntime.start(this,root)}}
