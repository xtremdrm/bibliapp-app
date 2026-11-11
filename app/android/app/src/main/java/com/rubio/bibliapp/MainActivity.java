package com.rubio.bibliapp;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 🔍 Permite inspeccionar la WebView desde chrome://inspect
        WebView.setWebContentsDebuggingEnabled(true);
    }
}