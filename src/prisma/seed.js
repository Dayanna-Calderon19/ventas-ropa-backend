import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
    console.log("Iniciando seed...");

    const hashAdmin = await bcrypt.hash("Admin123", SALT_ROUNDS);
    const hashVendedor = await bcrypt.hash("Vendedor123", SALT_ROUNDS);
    const hashCliente = await bcrypt.hash("Cliente123", SALT_ROUNDS);

    const admin = await prisma.usuario.upsert({
        where: { correo: "admin@tienda.com" },
        update: {},
        create: {
            nombre: "Administrador",
            correo: "admin@tienda.com",
            contrasena: hashAdmin,
            rol: "ADMIN",
        },
    });

    const vendedor = await prisma.usuario.upsert({
        where: { correo: "vendedor@tienda.com" },
        update: {},
        create: {
            nombre: "Juan Vendedor",
            correo: "vendedor@tienda.com",
            contrasena: hashVendedor,
            rol: "VENDEDOR",
        },
    });

    const cliente = await prisma.usuario.upsert({
        where: { correo: "cliente@tienda.com" },
        update: {},
        create: {
            nombre: "María Cliente",
            correo: "cliente@tienda.com",
            contrasena: hashCliente,
            rol: "CLIENTE",
            perfil: { create: { ciudad: "Lima", distrito: "Miraflores" } },
        },
    });

    const categorias = await Promise.all([
        prisma.categoria.upsert({
            where: { slug: "polos" },
            update: {},
            create: {
                nombre: "Polos",
                slug: "polos",
                descripcion: "Polos y camisetas",
            },
        }),
        prisma.categoria.upsert({
            where: { slug: "pantalones" },
            update: {},
            create: {
                nombre: "Pantalones",
                slug: "pantalones",
                descripcion: "Pantalones y jeans",
            },
        }),
        prisma.categoria.upsert({
            where: { slug: "vestidos" },
            update: {},
            create: {
                nombre: "Vestidos",
                slug: "vestidos",
                descripcion: "Vestidos y faldas",
            },
        }),
        prisma.categoria.upsert({
            where: { slug: "accesorios" },
            update: {},
            create: {
                nombre: "Accesorios",
                slug: "accesorios",
                descripcion: "Bolsos, cinturones y más",
            },
        }),
    ]);

    const productos = [
        {
            nombre: "Polo Básico Algodón",
            slug: "polo-basico-algodon",
            descripcion:
                "Polo de algodón 100% de alta calidad, ideal para el día a día.",
            precioBase: 49.9,
            destacado: true,
            categoriaId: categorias[0].id,
            variantes: [
                {
                    sku: "POL-BAS-S-BLA",
                    talla: "S",
                    color: "Blanco",
                    precio: 49.9,
                    stock: 20,
                },
                {
                    sku: "POL-BAS-M-BLA",
                    talla: "M",
                    color: "Blanco",
                    precio: 49.9,
                    stock: 15,
                },
                {
                    sku: "POL-BAS-L-BLA",
                    talla: "L",
                    color: "Blanco",
                    precio: 49.9,
                    stock: 10,
                },
                {
                    sku: "POL-BAS-S-NEG",
                    talla: "S",
                    color: "Negro",
                    precio: 49.9,
                    stock: 18,
                },
                {
                    sku: "POL-BAS-M-NEG",
                    talla: "M",
                    color: "Negro",
                    precio: 49.9,
                    stock: 12,
                },
                {
                    sku: "POL-BAS-L-NEG",
                    talla: "L",
                    color: "Negro",
                    precio: 49.9,
                    stock: 8,
                },
            ],
        },
        {
            nombre: "Jean Slim Fit",
            slug: "jean-slim-fit",
            descripcion: "Jean de corte slim moderno, cómodo y resistente.",
            precioBase: 129.9,
            destacado: true,
            categoriaId: categorias[1].id,
            variantes: [
                {
                    sku: "JEA-SLI-28-AZU",
                    talla: "28",
                    color: "Azul oscuro",
                    precio: 129.9,
                    stock: 10,
                },
                {
                    sku: "JEA-SLI-30-AZU",
                    talla: "30",
                    color: "Azul oscuro",
                    precio: 129.9,
                    stock: 14,
                },
                {
                    sku: "JEA-SLI-32-AZU",
                    talla: "32",
                    color: "Azul oscuro",
                    precio: 129.9,
                    stock: 9,
                },
                {
                    sku: "JEA-SLI-30-NEG",
                    talla: "30",
                    color: "Negro",
                    precio: 139.9,
                    stock: 6,
                },
                {
                    sku: "JEA-SLI-32-NEG",
                    talla: "32",
                    color: "Negro",
                    precio: 139.9,
                    stock: 4,
                },
            ],
        },
        {
            nombre: "Vestido Floral Verano",
            slug: "vestido-floral-verano",
            descripcion:
                "Vestido ligero con estampado floral, perfecto para el verano.",
            precioBase: 89.9,
            destacado: false,
            categoriaId: categorias[2].id,
            variantes: [
                {
                    sku: "VES-FLO-S-ROJ",
                    talla: "S",
                    color: "Rojo floral",
                    precio: 89.9,
                    stock: 7,
                },
                {
                    sku: "VES-FLO-M-ROJ",
                    talla: "M",
                    color: "Rojo floral",
                    precio: 89.9,
                    stock: 5,
                },
                {
                    sku: "VES-FLO-S-AZU",
                    talla: "S",
                    color: "Azul floral",
                    precio: 89.9,
                    stock: 3,
                },
                {
                    sku: "VES-FLO-M-AZU",
                    talla: "M",
                    color: "Azul floral",
                    precio: 89.9,
                    stock: 2,
                },
            ],
        },
        {
            nombre: "Polo Oversize Urbano",
            slug: "polo-oversize-urbano",
            descripcion:
                "Polo de corte oversize con estilo urbano contemporáneo.",
            precioBase: 69.9,
            destacado: true,
            categoriaId: categorias[0].id,
            variantes: [
                {
                    sku: "POL-OVE-S-GRI",
                    talla: "S",
                    color: "Gris",
                    precio: 69.9,
                    stock: 12,
                },
                {
                    sku: "POL-OVE-M-GRI",
                    talla: "M",
                    color: "Gris",
                    precio: 69.9,
                    stock: 10,
                },
                {
                    sku: "POL-OVE-L-GRI",
                    talla: "L",
                    color: "Gris",
                    precio: 69.9,
                    stock: 8,
                },
                {
                    sku: "POL-OVE-XL-GRI",
                    talla: "XL",
                    color: "Gris",
                    precio: 69.9,
                    stock: 0,
                },
            ],
        },
    ];

    for (const prod of productos) {
        const { variantes, ...dataProd } = prod;
        const existente = await prisma.producto.findUnique({
            where: { slug: prod.slug },
        });
        if (!existente) {
            await prisma.producto.create({
                data: {
                    ...dataProd,
                    variantes: { create: variantes },
                },
            });
        }
    }

    console.log("Seed completado:");
    console.log("  Admin:    admin@tienda.com / Admin123");
    console.log("  Vendedor: vendedor@tienda.com / Vendedor123");
    console.log("  Cliente:  cliente@tienda.com / Cliente123");
    console.log(`  ${categorias.length} categorías creadas`);
    console.log(`  ${productos.length} productos creados`);
}

main()
    .catch((e) => {
        console.error("Error en seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
