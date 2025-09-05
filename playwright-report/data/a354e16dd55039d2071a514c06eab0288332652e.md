# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Memoria Eterna" [level=1] [ref=e6]
      - heading "Iniciar Sesión" [level=2] [ref=e7]
      - paragraph [ref=e8]: Accede a tu cuenta para continuar
    - generic [ref=e9]:
      - heading "Credenciales" [level=3] [ref=e11]
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]:
            - generic [ref=e15]: Email
            - textbox "Email" [ref=e16]
          - generic [ref=e17]:
            - generic [ref=e18]: Contraseña
            - textbox "Contraseña" [ref=e19]
        - generic [ref=e20]:
          - button "Iniciar Sesión" [ref=e21] [cursor=pointer]
          - paragraph [ref=e23]:
            - text: ¿No tienes una cuenta?
            - link "Regístrate aquí" [ref=e24]:
              - /url: /register
    - link "← Volver al inicio" [ref=e26]:
      - /url: /
  - alert [ref=e27]
```