# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Memoria Eterna" [level=1] [ref=e6]
      - heading "Crear Cuenta" [level=2] [ref=e7]
      - paragraph [ref=e8]: Únete a nuestra comunidad y comienza a preservar tus recuerdos
    - generic [ref=e9]:
      - heading "Información Personal" [level=3] [ref=e11]
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]:
            - generic [ref=e15]: Nombre completo
            - textbox "Nombre completo" [ref=e16]
          - generic [ref=e17]:
            - generic [ref=e18]: Email
            - textbox "Email" [ref=e19]
          - generic [ref=e20]:
            - generic [ref=e21]: Contraseña
            - textbox "Contraseña" [ref=e22]
            - paragraph [ref=e23]: Mínimo 6 caracteres
          - generic [ref=e24]:
            - generic [ref=e25]: Confirmar contraseña
            - textbox "Confirmar contraseña" [ref=e26]
        - generic [ref=e27]:
          - button "Crear Cuenta" [ref=e28] [cursor=pointer]
          - paragraph [ref=e30]:
            - text: ¿Ya tienes una cuenta?
            - link "Inicia sesión aquí" [ref=e31]:
              - /url: /login
    - link "← Volver al inicio" [ref=e33]:
      - /url: /
  - alert [ref=e34]
```