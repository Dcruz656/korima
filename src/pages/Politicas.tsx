import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navigation } from "@/components/nexus/Navigation";
import { FileText, Shield, Cookie, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Politicas() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container max-w-4xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Políticas del Sitio</h1>
          <p className="text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <Tabs defaultValue="terminos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="terminos" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Términos</span>
            </TabsTrigger>
            <TabsTrigger value="privacidad" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Privacidad</span>
            </TabsTrigger>
            <TabsTrigger value="cookies" className="gap-2">
              <Cookie className="w-4 h-4" />
              <span className="hidden sm:inline">Cookies</span>
            </TabsTrigger>
            <TabsTrigger value="disclaimer" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Aviso Legal</span>
            </TabsTrigger>
          </TabsList>

          <div className="card-fb p-6 md:p-8">
            <ScrollArea className="h-[60vh]">
              <TabsContent value="terminos" className="mt-0 pr-4">
                <TerminosContent />
              </TabsContent>

              <TabsContent value="privacidad" className="mt-0 pr-4">
                <PrivacidadContent />
              </TabsContent>

              <TabsContent value="cookies" className="mt-0 pr-4">
                <CookiesContent />
              </TabsContent>

              <TabsContent value="disclaimer" className="mt-0 pr-4">
                <DisclaimerContent />
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Si tienes preguntas sobre estas políticas, puedes contactarnos a través de la plataforma.
          </p>
        </div>
      </main>
    </div>
  );
}

function TerminosContent() {
  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Términos y Condiciones de Uso
        </h2>
        <p className="text-muted-foreground mb-4">
          Bienvenido a Kórima. Al acceder y utilizar esta plataforma, aceptas cumplir con los siguientes términos y condiciones.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold mb-2">1. Aceptación de los Términos</h3>
        <p className="text-muted-foreground">
          Al registrarte y utilizar Kórima, confirmas que has leído, entendido y aceptado estos términos en su totalidad. 
          Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar la plataforma.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">2. Descripción del Servicio</h3>
        <p className="text-muted-foreground">
          Kórima es una plataforma colaborativa que facilita el intercambio de documentos académicos y científicos 
          entre miembros de la comunidad. El servicio permite a los usuarios solicitar y compartir artículos, 
          papers y otros materiales educativos.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">3. Registro y Cuenta de Usuario</h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Debes proporcionar información veraz y actualizada durante el registro.</li>
          <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
          <li>No puedes crear múltiples cuentas ni compartir tu cuenta con terceros.</li>
          <li>Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">4. Uso Aceptable</h3>
        <p className="text-muted-foreground mb-2">Los usuarios se comprometen a:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Utilizar la plataforma exclusivamente con fines académicos y de investigación.</li>
          <li>No compartir contenido que viole derechos de autor de manera comercial.</li>
          <li>Respetar a otros miembros de la comunidad.</li>
          <li>No utilizar la plataforma para spam, phishing u otras actividades maliciosas.</li>
          <li>No intentar acceder a áreas restringidas del sistema.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">5. Sistema de Puntos</h3>
        <p className="text-muted-foreground">
          Kórima utiliza un sistema de puntos para incentivar la colaboración. Los puntos no tienen valor monetario 
          y no pueden ser canjeados por dinero. Nos reservamos el derecho de modificar el sistema de puntos 
          en cualquier momento.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">6. Contenido del Usuario</h3>
        <p className="text-muted-foreground">
          Los usuarios son responsables del contenido que comparten. Kórima no se hace responsable por el contenido 
          subido por los usuarios. Nos reservamos el derecho de eliminar contenido que consideremos inapropiado 
          o que viole estos términos.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">7. Modificaciones</h3>
        <p className="text-muted-foreground">
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados 
          a través de la plataforma. El uso continuado después de los cambios constituye aceptación de los nuevos términos.
        </p>
      </section>
    </div>
  );
}

function PrivacidadContent() {
  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Política de Privacidad
        </h2>
        <p className="text-muted-foreground mb-4">
          Tu privacidad es importante para nosotros. Esta política explica cómo recopilamos, usamos y protegemos tu información personal.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold mb-2">1. Información que Recopilamos</h3>
        <p className="text-muted-foreground mb-2">Recopilamos la siguiente información:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li><strong>Información de cuenta:</strong> Nombre, email, institución, país, especialidad.</li>
          <li><strong>Información de uso:</strong> Solicitudes realizadas, respuestas enviadas, puntos acumulados.</li>
          <li><strong>Información técnica:</strong> Dirección IP, tipo de navegador, dispositivo utilizado.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">2. Uso de la Información</h3>
        <p className="text-muted-foreground mb-2">Utilizamos tu información para:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Proporcionar y mejorar nuestros servicios.</li>
          <li>Gestionar tu cuenta y el sistema de puntos.</li>
          <li>Enviarte notificaciones relevantes sobre la plataforma.</li>
          <li>Generar estadísticas anónimas sobre el uso de la plataforma.</li>
          <li>Prevenir fraudes y garantizar la seguridad.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">3. Compartición de Datos</h3>
        <p className="text-muted-foreground">
          No vendemos ni compartimos tu información personal con terceros, excepto:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
          <li>Cuando sea requerido por ley.</li>
          <li>Para proteger nuestros derechos legales.</li>
          <li>Con proveedores de servicios que nos ayudan a operar la plataforma (bajo acuerdos de confidencialidad).</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">4. Seguridad de los Datos</h3>
        <p className="text-muted-foreground">
          Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, incluyendo:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
          <li>Encriptación de datos en tránsito (HTTPS).</li>
          <li>Almacenamiento seguro con acceso restringido.</li>
          <li>Autenticación segura de usuarios.</li>
          <li>Monitoreo regular de seguridad.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">5. Tus Derechos</h3>
        <p className="text-muted-foreground mb-2">Tienes derecho a:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Acceder a tus datos personales.</li>
          <li>Corregir información incorrecta.</li>
          <li>Solicitar la eliminación de tu cuenta y datos.</li>
          <li>Oponerte al procesamiento de tus datos.</li>
          <li>Exportar tus datos en formato legible.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">6. Retención de Datos</h3>
        <p className="text-muted-foreground">
          Conservamos tu información mientras tu cuenta esté activa. Si solicitas la eliminación de tu cuenta, 
          eliminaremos tus datos personales en un plazo de 30 días, excepto aquellos que debamos conservar por 
          obligaciones legales.
        </p>
      </section>
    </div>
  );
}

function CookiesContent() {
  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Cookie className="w-6 h-6 text-primary" />
          Política de Cookies
        </h2>
        <p className="text-muted-foreground mb-4">
          Esta política explica qué son las cookies, cómo las utilizamos y cómo puedes gestionarlas.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold mb-2">1. ¿Qué son las Cookies?</h3>
        <p className="text-muted-foreground">
          Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. 
          Permiten que el sitio recuerde tus acciones y preferencias durante un período de tiempo.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">2. Tipos de Cookies que Utilizamos</h3>
        
        <div className="space-y-3 mt-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-foreground">Cookies Esenciales</h4>
            <p className="text-sm text-muted-foreground">
              Necesarias para el funcionamiento básico del sitio. Incluyen cookies de sesión y autenticación.
            </p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-foreground">Cookies de Preferencias</h4>
            <p className="text-sm text-muted-foreground">
              Almacenan tus preferencias como el tema (claro/oscuro) y configuración de idioma.
            </p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-foreground">Cookies de Análisis</h4>
            <p className="text-sm text-muted-foreground">
              Nos ayudan a entender cómo los usuarios interactúan con la plataforma para mejorar la experiencia.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">3. Duración de las Cookies</h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li><strong>Cookies de sesión:</strong> Se eliminan al cerrar el navegador.</li>
          <li><strong>Cookies persistentes:</strong> Permanecen por un período determinado (máximo 1 año).</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">4. Gestión de Cookies</h3>
        <p className="text-muted-foreground">
          Puedes controlar y gestionar las cookies a través de la configuración de tu navegador. 
          Ten en cuenta que desactivar ciertas cookies puede afectar la funcionalidad del sitio.
        </p>
        <p className="text-muted-foreground mt-2">
          La mayoría de navegadores te permiten:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-1">
          <li>Ver qué cookies tienes y eliminarlas individualmente.</li>
          <li>Bloquear cookies de terceros.</li>
          <li>Bloquear cookies de sitios específicos.</li>
          <li>Bloquear todas las cookies.</li>
          <li>Eliminar todas las cookies al cerrar el navegador.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">5. Cookies de Terceros</h3>
        <p className="text-muted-foreground">
          Algunos servicios de terceros que utilizamos pueden establecer sus propias cookies:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
          <li><strong>Autenticación:</strong> Para el inicio de sesión con Google.</li>
          <li><strong>Almacenamiento:</strong> Para la gestión de archivos y sesiones.</li>
        </ul>
      </section>
    </div>
  );
}

function DisclaimerContent() {
  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-urgent" />
          Aviso Legal / Disclaimer
        </h2>
        <p className="text-muted-foreground mb-4">
          Lee atentamente este aviso legal antes de utilizar la plataforma Kórima.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold mb-2">1. Naturaleza del Servicio</h3>
        <p className="text-muted-foreground">
          Kórima es una plataforma colaborativa que facilita el intercambio de documentos académicos entre sus usuarios. 
          La plataforma actúa únicamente como intermediario y <strong>no aloja, almacena de forma permanente ni distribuye 
          contenido de manera masiva</strong>.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">2. No Almacenamiento Permanente</h3>
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-muted-foreground">
            <strong className="text-primary">Política de eliminación automática:</strong> Los archivos compartidos 
            en Kórima se eliminan automáticamente después de <strong>5 días</strong>. Kórima no mantiene repositorios 
            permanentes de documentos ni publica material de forma masiva. Cada intercambio es temporal y 
            punto a punto entre usuarios.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">3. Responsabilidad Exclusiva del Usuario</h3>
        <div className="p-4 bg-urgent/10 border border-urgent/20 rounded-lg space-y-3">
          <p className="text-muted-foreground">
            <strong className="text-urgent">Aviso importante:</strong> Kórima <strong>no se hace responsable bajo 
            ninguna circunstancia</strong> por el contenido compartido por los usuarios. Los usuarios que comparten 
            documentos asumen <strong>toda la responsabilidad legal</strong> sobre:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Derechos de autor y propiedad intelectual.</li>
            <li>Cumplimiento de leyes locales e internacionales.</li>
            <li>Licencias y permisos de distribución.</li>
            <li>Cualquier reclamación legal derivada del contenido compartido.</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Al compartir cualquier documento, el usuario declara que tiene el derecho o la autorización necesaria 
            para hacerlo y exime a Kórima de cualquier responsabilidad.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">4. Uso Académico y Educativo</h3>
        <p className="text-muted-foreground">
          Esta plataforma está diseñada exclusivamente para uso académico y educativo. El intercambio de documentos 
          debe realizarse bajo los principios de:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
          <li>Uso justo (fair use) para fines educativos.</li>
          <li>Acceso temporal a materiales de investigación.</li>
          <li>Colaboración académica sin fines de lucro.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">5. Propiedad Intelectual</h3>
        <p className="text-muted-foreground">
          Respetamos la propiedad intelectual. Si eres titular de derechos de autor y consideras que algún contenido 
          en nuestra plataforma infringe tus derechos, puedes contactarnos para solicitar su eliminación inmediata.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">6. Limitación de Responsabilidad</h3>
        <p className="text-muted-foreground">
          Kórima se proporciona "tal cual" sin garantías de ningún tipo. No garantizamos:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
          <li>La disponibilidad ininterrumpida del servicio.</li>
          <li>La exactitud, legalidad o calidad del contenido compartido por usuarios.</li>
          <li>Que el servicio esté libre de errores o virus.</li>
          <li>La idoneidad del contenido para propósitos específicos.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">7. Eliminación Automática de Contenido</h3>
        <p className="text-muted-foreground">
          Como parte de nuestra política de no almacenamiento permanente, todos los archivos compartidos 
          se eliminan automáticamente después de 5 días. Esta política es intencional y forma parte de 
          nuestro compromiso con el uso temporal y académico de los materiales. No existe forma de recuperar 
          archivos eliminados.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">8. Jurisdicción</h3>
        <p className="text-muted-foreground">
          Este aviso legal se rige por las leyes aplicables. Cualquier disputa relacionada con el uso de 
          la plataforma será sometida a los tribunales competentes.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">9. Contacto</h3>
        <p className="text-muted-foreground">
          Para cualquier consulta legal o solicitud relacionada con estos términos, puedes contactarnos 
          a través de los canales disponibles en la plataforma.
        </p>
      </section>
    </div>
  );
}
