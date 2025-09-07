import tkinter as tk
from tkinter import messagebox

COLORS = {
    "primary": "#427898",
    "secondary": "#1b2538",
    "accent": "#b5d2dd",
    "background": "#f8faf0",
    "text": "#737373"
}


class LoginApp:
    def __init__(self, root):
        self.root = root
        root.title("Login")
        root.configure(bg=COLORS["background"])

        self.frame = tk.Frame(root, bg=COLORS["secondary"], bd=2, relief="groove")
        self.frame.pack(padx=20, pady=20)

        tk.Label(
            self.frame,
            text="Usuario",
            bg=COLORS["secondary"],
            fg=COLORS["accent"],
        ).grid(row=0, column=0, pady=10, padx=10)
        self.user_entry = tk.Entry(
            self.frame, bg=COLORS["accent"], fg=COLORS["text"]
        )
        self.user_entry.grid(row=0, column=1, pady=10, padx=10)

        tk.Label(
            self.frame,
            text="Contraseña",
            bg=COLORS["secondary"],
            fg=COLORS["accent"],
        ).grid(row=1, column=0, pady=10, padx=10)
        self.pass_entry = tk.Entry(
            self.frame, show="*", bg=COLORS["accent"], fg=COLORS["text"]
        )
        self.pass_entry.grid(row=1, column=1, pady=10, padx=10)

        login_btn = tk.Button(
            self.frame,
            text="Ingresar",
            bg=COLORS["primary"],
            fg=COLORS["background"],
            command=self.login,
        )
        login_btn.grid(row=2, column=0, columnspan=2, pady=10, padx=10)

    def login(self):
        user = self.user_entry.get()
        password = self.pass_entry.get()
        if user == "admin" and password == "admin":
            messagebox.showinfo("Login", "¡Bienvenido!")
        else:
            messagebox.showerror("Login", "Credenciales incorrectas")


if __name__ == "__main__":
    root = tk.Tk()
    app = LoginApp(root)
    root.mainloop()
