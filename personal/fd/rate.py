# Folklorish Rate.
# Author: Slush
# Date: 1/16/25

import tkinter as tk
from tkinter import messagebox, ttk

def show_rate_window():
    rate_window = tk.Tk()
    rate_window.title("Rate Bot")
    rate_window.geometry("400x250")
    tk.Label(rate_window, text="Please enter a concept to be rated and your no bias rating:", font=("Arial", 9)).pack(pady=10)
    tk.Label(rate_window, text="Concept:", font=("Arial", 9)).pack(anchor=tk.W, padx=20)
    entry1 = tk.Entry(rate_window, width=30)
    entry1.pack(pady=5, padx=20)
    tk.Label(rate_window, text="Rating:", font=("Arial", 9)).pack(anchor=tk.W, padx=20)
    entry2 = tk.Entry(rate_window, width=30)
    entry2.pack(pady=5, padx=20)
    button_frame = tk.Frame(rate_window)
    button_frame.pack(pady=10)

    def handle_rate():
        concept = entry1.get()
        rating = entry2.get()
        if concept and rating:
            messagebox.showinfo("Rating Complete", f"{concept} is a {rating} no bias")
        else:
            messagebox.showwarning("Major Rating Error", "I ain't gonna lie, I lost the load")

    ttk.Button(button_frame, text="Rate", command=handle_rate).pack(side=tk.LEFT, padx=5)
    ttk.Button(button_frame, text="Done rating", command=rate_window.destroy).pack(side=tk.LEFT, padx=5)
