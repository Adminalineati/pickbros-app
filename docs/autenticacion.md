# Autenticación y registro

## Flujo funcional

El registro solicita nombre, apellido, correo, contraseña, fecha de nacimiento,
teléfono en formato internacional, país, estado y suscripción.

El API valida:

- correo normalizado y único;
- teléfono único en formato E.164;
- contraseña de 12 a 72 caracteres con mayúscula, minúscula, número y símbolo;
- edad mínima de 18 años;
- código de verificación con vigencia de 10 minutos.

La contraseña se almacena únicamente como hash bcrypt. Los códigos de
verificación y recuperación se almacenan como HMAC, nunca en texto plano.

## Inicio de sesión

La sesión local usa un JWT con vigencia de una hora dentro de una cookie
`HttpOnly` y `SameSite=Strict`. El navegador no tiene acceso al token.

Después de tres contraseñas incorrectas, la cuenta queda bloqueada durante 15
minutos. Una recuperación de contraseña válida elimina el bloqueo.

## Correo y SMS

En el demo local no se envían mensajes reales. La variable
`LOCAL_AUTH_EXPOSE_CODES=true` muestra los códigos exclusivamente para pruebas.
Esta variable debe permanecer deshabilitada en AWS.

En AWS:

- Cognito envía el enlace de confirmación del correo;
- Cognito usa Amazon SNS para recuperar la contraseña por SMS;
- el teléfono debe verificarse antes de poder usarlo como medio de recuperación;
- la cuenta de AWS debe salir del sandbox de SMS antes de enviar a cualquier
  número real.

## Proveedores sociales

Google, Apple y Microsoft no se habilitan todavía. Cada proveedor requiere
registrar PickBros en su consola, configurar dominio y URLs de retorno, y guardar
sus secretos fuera del repositorio. Se incorporarán mediante federación de
Cognito sin cambiar el modelo de usuarios.
