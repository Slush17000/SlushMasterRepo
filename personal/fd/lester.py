# Folklorish Lester.
# Author: Slush
# Date: 1/16/25

import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk

def lester(progress_bar, label):
    def show_lester():
        custom_box = tk.Toplevel(progress_bar.master)
        custom_box.title("Critical Lester Error")
        custom_box.geometry("300x150")
        custom_box.resizable(False, False)
        tk.Label(custom_box, text="You shouldn't have done that", font=("Arial", 9)).pack(pady=20)
        button_frame = tk.Frame(custom_box)
        button_frame.pack(pady=10)
        ttk.Button(button_frame, text="Fuck", command=custom_box.destroy).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Remain ignorant", command=lambda: show_chud(custom_box)).pack(side=tk.LEFT, padx=5)
        custom_box.grab_set()
        progress_bar.master.wait_window(custom_box)

    def show_chud(custom_box):
        custom_box.destroy()
        chud_window = tk.Toplevel(progress_bar.master)
        chud_window.title("You")
        image = Image.open("chud.jpg")
        photo = ImageTk.PhotoImage(image)
        image_label = tk.Label(chud_window, image=photo)
        image_label.image = photo
        image_label.pack(pady=20)
        ttk.Button(chud_window, text="I AM NOT A BUMLUSS!", command=chud_window.destroy).pack(side=tk.LEFT, padx=5)
        chud_window.grab_set()
        progress_bar.master.wait_window(chud_window)

    def update_lester(value=0):
        if value <= 100:
            progress_bar['value'] = value
            label.config(text=f"Lester: {value}%")
            progress_bar.master.after(50, update_lester, value + 1)
        else:
            label.config(text="Lester is now in your house!")
            show_lester()

    update_lester()
