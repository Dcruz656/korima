import { ArrowRight, BookOpen, Users, Sparkles, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-points/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-teal-400/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-secondary-foreground">
              Red de Conocimiento Académico
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 animate-fade-in">
            Conecta. Comparte.{" "}
            <span className="gradient-text">Descubre.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            La plataforma donde investigadores, docentes y bibliotecarios intercambian conocimiento científico y ganan puntos por colaborar.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in">
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-lg font-bold shadow-nexus-lg">
              <Link to="/auth">
                Comenzar ahora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 py-6 text-lg font-semibold">
              <Link to="/feed">
                Explorar feed
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in">
            {[
              { icon: Users, value: "2,500+", label: "Investigadores" },
              { icon: BookOpen, value: "15,000+", label: "Documentos" },
              { icon: Coins, value: "50,000+", label: "Puntos activos" },
              { icon: Sparkles, value: "98%", label: "Satisfacción" },
            ].map((stat, index) => (
              <div
                key={index}
                className="card-nexus p-6 text-center hover:shadow-nexus-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
