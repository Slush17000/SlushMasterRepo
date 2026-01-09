# Folklorish Driver.
# Author: Slush
# Date: 1/16/25

import tkinter as tk
from tkinter import simpledialog, messagebox, ttk
from folklorishDictionary import create_dictionary
from lester import lester
from rate import show_rate_window
import sys

class SecureInputDialog(simpledialog.Dialog):
    def __init__(self, parent, title):
        self.result = None
        super().__init__(parent, title)
    
    def body(self, master):
        tk.Label(master, text="The Old Chestament is on a need-to-know basis: ").grid(row=0, column=0)
        self.entry = tk.Entry(master, show="*")
        self.entry.grid(row=0, column=1)
        return self.entry

    def apply(self):
        self.result = self.entry.get()

def secure_input(title):
    root = tk.Tk()
    root.withdraw()
    dialog = SecureInputDialog(root, title)
    return dialog.result

def quit_program(event=None):
    print("Jaulp U L8R")
    root.destroy()
    sys.exit()

if __name__ == "__main__":
    print("°º¤ø,¸¸,ø¤º°`°º¤ø,¸,ø¤°º¤ø,¸¸,ø¤º°`°º¤ø,¸°º¤ø,¸¸,ø¤º°`°º¤ø,¸,ø¤°º¤ø,¸¸,ø¤º°`°º¤ø,¸°º¤ø,¸¸,ø")
    root = tk.Tk()
    root.withdraw()
    root.bind_all("<q>", quit_program)
    password = secure_input("HOW?!")
    if password is not None:
        if password == "Chester69420!":
            create_dictionary("folklorishDictionary.txt")
        elif password == "rate":
            show_rate_window()
            root.mainloop()
        elif password == "lester":
            root.deiconify()
            root.title("Lester")
            root.geometry("400x200")
            progress_label = ttk.Label(root, text="Lester", font=("Arial", 9))
            progress_label.pack(pady=10)
            progress_bar = ttk.Progressbar(root, orient=tk.HORIZONTAL, length=300, mode='determinate')
            progress_bar.pack(pady=10)
            start_btn = ttk.Button(root, text="Lester", command=lambda: lester(progress_bar, progress_label))
            start_btn.pack(pady=20)
            root.mainloop()
        else:
            messagebox.showwarning("Fatal Jaulping Error", "You're chaulked kid")
    else:
        messagebox.showwarning("Minor Scalping Error", "Never join a call with these 3 scalpers")
    print("°º¤ø,¸¸,ø¤º°`°º¤ø,¸,ø¤°º¤ø,¸¸,ø¤º°`°º¤ø,¸°º¤ø,¸¸,ø¤º°`°º¤ø,¸,ø¤°º¤ø,¸¸,ø¤º°`°º¤ø,¸°º¤ø,¸¸,ø")
    root.destroy()
