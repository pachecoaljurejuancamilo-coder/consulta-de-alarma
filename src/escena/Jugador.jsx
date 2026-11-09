// Jugador en tercera persona: controlador cinemático de Rapier + animaciones.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import { Vector3, Mesh, RingGeometry, MeshBasicMaterial, AdditiveBlending, DoubleSide, CircleGeometry } from 'three';
import { G, ahora, sacudir } from '../juego/mundo.js';
import { dispararRayo, buscarObjetivo, direccionApuntado, conoAsistencia, ALCANCE } from '../juego/combate.js';
import { FX } from '../juego/efectos.js';
import { sonido } from '../audio/audio.js';
import { xCarrera, PASARELA } from '../juego/mapa.js';
import { TIEMPOS as T, AVATARES } from '../data/contenido.js';
import { useJuego } from '../estado/store.js';
import { MODELOS, vestirEstudiante, Animador } from './personajes.js';

const VEL_CORRER = 6.6;
const VEL_DASH = 17;
const DUR_DASH = 0.3;
const SALTO = 7.4;
const GRAVEDAD = 22;

const tmp = new Vector3();
const deseo = new Vector3();
const dirAp = new Vector3();

export default function Jugador() {
  const avatarId = useJuego((s) => s.perfil.avatar);
  const avatar = AVATARES.find((a) => a.id === avatarId) || AVATARES[0];
  const gltfs = {
    mujer: useGLTF(MODELOS.mujer, false, true),
    barba: useGLTF(MODELOS.barba, false, true),
    corto: useGLTF(MODELOS.corto, false, true),
  };
  const gltf = gltfs[avatar.modelo];

  const { modelo, animador, mano } = useMemo(() => {
    const modelo = vestirEstudiante(gltf, avatar);
    const animador = new Animador(modelo, gltf.animations);
    let mano = null;
    modelo.traverse((o) => {
      if (!mano && o.isBone && o.name === 'Wrist.R') mano = o;
    });
    return { modelo, animador, mano };
  }, [gltf, avatar]);

  const cuerpo = useRef();
  const colisor = useRef();
  const grupo = useRef();
  const sombraBlob = useRef();
  const { world } = useRapier();
  const controlador = useMemo(() => {
    const c = world.createCharacterController(0.03);
    c.enableSnapToGround(0.35);
    c.enableAutostep(0.35, 0.2, true);
    c.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    c.setApplyImpulsesToDynamicBodies(false);
    c.setSlideEnabled(true);
    return c;
  }, [world]);
  useEffect(() => () => world.removeCharacterController(controlador), [world, controlador]);

  // Mira de bloqueo sobre el objetivo asistido
  const mira = useMemo(() => {
    const m = new Mesh(
      new RingGeometry(0.55, 0.68, 32),
      new MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.9, blending: AdditiveBlending, side: DoubleSide, depthTest: false, toneMapped: false }),
    );
    m.renderOrder = 10;
    m.visible = false;
    return m;
  }, []);

  useEffect(() => {
    animador.play('Idle');
  }, [animador]);

  useFrame((state, dtReal) => {
    const j = G.jugador;
    const E = G.entrada;
    const body = cuerpo.current;
    const col = colisor.current;
    if (!body || !col) return;
    const t = ahora();
    const dt = Math.min(dtReal, 0.1) * G.escala;

    // Teletransporte pendiente
    if (j.teleport) {
      const p = j.teleport;
      body.setTranslation({ x: p.x, y: p.y, z: p.z }, true);
      body.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z });
      j.pos.set(p.x, p.y, p.z);
      j.vel.set(0, 0, 0);
      j.vy = 0;
      if (p.yaw !== undefined) {
        j.yaw = p.yaw;
        G.camara.yaw = p.yaw;
      }
      j.teleport = null;
    }

    let moviendo = 0;
    if (j.modo === 'libre' && G.activo) {
      // Dirección relativa a la cámara
      const cy = G.camara.yaw;
      const fx = Math.sin(cy);
      const fz = Math.cos(cy);
      const rx = -Math.cos(cy);
      const rz = Math.sin(cy);
      deseo.set(fx * E.my + rx * E.mx, 0, fz * E.my + rz * E.mx);
      const mag = Math.min(1, deseo.length());
      if (mag > 0.01) deseo.normalize();
      const velObjetivo = VEL_CORRER * (mag < 0.55 && E.tactil ? mag * 0.75 + 0.1 : mag);

      // Dash
      if (E.dash && t > j.dashListo) {
        j.dashHasta = t + DUR_DASH;
        j.dashListo = t + 0.85;
        j.invulnHasta = Math.max(j.invulnHasta, t + DUR_DASH + 0.1);
        if (mag > 0.01) j.dashDir.copy(deseo);
        else j.dashDir.set(Math.sin(j.yaw), 0, Math.cos(j.yaw));
        j.yaw = Math.atan2(j.dashDir.x, j.dashDir.z);
        sonido('dash');
        sacudir(0.08);
      }
      const enDash = t < j.dashHasta;
      if (enDash) {
        j.vel.set(j.dashDir.x * VEL_DASH, 0, j.dashDir.z * VEL_DASH);
        FX.estela(tmp.set(j.pos.x, j.pos.y + 1, j.pos.z), '#f4a3b7');
      } else {
        const k = 1 - Math.exp(-14 * dt);
        j.vel.x += (deseo.x * velObjetivo - j.vel.x) * k;
        j.vel.z += (deseo.z * velObjetivo - j.vel.z) * k;
      }
      // Empuje por golpe
      if (j.empuje && t < j.empuje.hasta) {
        j.vel.x += j.empuje.x * dt * 8;
        j.vel.z += j.empuje.z * dt * 8;
      }
      // Salto
      if (E.saltar && j.enSuelo) {
        j.vy = SALTO;
        j.enSuelo = false;
        sonido('salto');
        FX.estallido(tmp.set(j.pos.x, j.pos.y + 0.1, j.pos.z), { color: '#fff1d6', cantidad: 10, velocidad: 2, vida: 0.4, tam: 0.25 });
      }
      j.vy -= GRAVEDAD * dt;
      if (j.enSuelo && j.vy < 0) j.vy = -2;

      // Movimiento con colisiones
      const delta = { x: j.vel.x * dt, y: j.vy * dt, z: j.vel.z * dt };
      controlador.computeColliderMovement(col, delta);
      const m = controlador.computedMovement();
      const p = body.translation();
      const nx = p.x + m.x;
      const ny = Math.max(-1, p.y + m.y);
      const nz = p.z + m.z;
      body.setNextKinematicTranslation({ x: nx, y: ny, z: nz });
      const antesSuelo = j.enSuelo;
      j.enSuelo = controlador.computedGrounded();
      if (j.enSuelo && !antesSuelo && j.vy < -6) FX.estallido(tmp.set(nx, ny + 0.1, nz), { color: '#fff1d6', cantidad: 12, velocidad: 2.5, vida: 0.4, tam: 0.25 });
      if (j.enSuelo && j.vy < 0) j.vy = -2;
      if (!j.enSuelo && m.y > j.vy * dt + 0.001 && j.vy > 0) j.vy = 0; // techo
      j.pos.set(nx, ny, nz);
      moviendo = Math.hypot(m.x, m.z) / Math.max(dt, 1e-4);
      if (dt > 0) j.velocidadActual = moviendo;

      // Orientación del cuerpo
      if (t > j.disparoHasta && !enDash && mag > 0.05) {
        const objetivoYaw = Math.atan2(deseo.x, deseo.z);
        let d = objetivoYaw - j.yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        j.yaw += d * Math.min(1, dt * 14);
      }

      // Disparo (clic, botón o tecla; mantener = ráfaga)
      if (E.disparar || (E.mantenerDisparo && t > j.disparoListo)) dispararRayo();

      // Objetivo asistido para la mira
      direccionApuntado(dirAp);
      G.objetivoActual = buscarObjetivo(j.mano, dirAp, conoAsistencia(), ALCANCE);
    } else if (j.modo === 'carrera' && G.activo) {
      // Carrera automática hacia -x; el jugador elige el carril
      const tl = G.t - (T.porMision * 3 + T.jefe);
      const x = xCarrera(tl, T.salidaIntro);
      if (Math.abs(E.mx) > 0.3) j.lateralUsado = true;
      j.pos.z = Math.max(-6.2, Math.min(6.2, j.pos.z - E.mx * 7.5 * dt));
      if (E.saltar && j.enSuelo) {
        j.vy = SALTO;
        j.enSuelo = false;
        sonido('salto');
      }
      if (E.dash && t > j.dashListo) {
        j.dashListo = t + 0.8;
        j.dashHasta = t + 0.25;
        sonido('dash');
      }
      j.vy -= GRAVEDAD * dt;
      let y = j.pos.y + j.vy * dt;
      if (y <= PASARELA.y + 0.05) {
        y = PASARELA.y + 0.05;
        j.vy = 0;
        j.enSuelo = true;
      }
      j.pos.set(x, y, j.pos.z);
      body.setNextKinematicTranslation({ x, y, z: j.pos.z });
      j.yaw = -Math.PI / 2 + E.mx * -0.35;
      moviendo = tl > T.salidaIntro ? PASARELA.velocidad : 0;
      if (t < j.dashHasta) FX.estela(tmp.set(x, y + 1, j.pos.z), '#f4a3b7');
      G.objetivoActual = null;
    } else {
      // Quieto (cinemática, selección o resultados)
      const p = body.translation();
      j.pos.set(p.x, p.y, p.z);
      body.setNextKinematicTranslation(p);
      G.objetivoActual = null;
    }

    // Modelo
    const g = grupo.current;
    g.position.copy(j.pos);
    g.rotation.y = j.yaw;

    // Animación
    const enDash = t < j.dashHasta;
    if (j.victoria) animador.play('Wave', { fundido: 0.4 });
    else if (t < j.golpeHasta) animador.play('HitRecieve', { unaVez: true, escala: 1.4, fundido: 0.08 });
    else if (enDash) animador.play('Roll', { unaVez: true, escala: 2.4, fundido: 0.05 });
    else if (!j.enSuelo && j.modo !== 'quieto') animador.play('Run', { escala: 0.25, fundido: 0.12 });
    else if (t < j.disparoHasta) animador.play(moviendo > 1 ? 'Run_Shoot' : 'Gun_Shoot', { unaVez: moviendo <= 1, escala: 1.6, fundido: 0.06 });
    else if (moviendo > 4.2) animador.play('Run', { escala: Math.max(0.8, moviendo / VEL_CORRER), fundido: 0.15 });
    else if (moviendo > 0.4) animador.play('Walk', { escala: Math.max(0.7, moviendo / 2.6), fundido: 0.15 });
    else animador.play('Idle', { fundido: 0.25 });
    animador.update(dt);

    // Posición de la mano (origen del rayo)
    if (mano) mano.getWorldPosition(j.mano);
    else j.mano.set(j.pos.x + Math.sin(j.yaw) * 0.5, j.pos.y + 1.3, j.pos.z + Math.cos(j.yaw) * 0.5);

    // Parpadeo durante la invulnerabilidad tras un golpe
    g.visible = !(t < j.invulnHasta && t > j.dashHasta + 0.1 && Math.floor(t * 20) % 2 === 0);

    // Sombra circular (calidad baja)
    if (sombraBlob.current) {
      sombraBlob.current.position.set(j.pos.x, Math.floor(j.pos.y * 10) / 10 + 0.03, j.pos.z);
      sombraBlob.current.visible = G.calidad === 'baja';
    }

    // Mira
    const obj = G.objetivoActual;
    if (obj && j.modo === 'libre') {
      mira.visible = true;
      mira.position.copy(obj.pos);
      mira.quaternion.copy(state.camera.quaternion);
      const s = (obj.radio || 0.5) * 1.6 * (1 + Math.sin(t * 10) * 0.06);
      mira.scale.setScalar(s);
    } else mira.visible = false;
  }, -2);

  return (
    <>
      <RigidBody ref={cuerpo} type="kinematicPosition" colliders={false} position={[0, 0.05, 20]} enabledRotations={[false, false, false]}>
        <CapsuleCollider ref={colisor} args={[0.5, 0.35]} position={[0, 0.86, 0]} />
      </RigidBody>
      <group ref={grupo}>
        <primitive object={modelo} />
      </group>
      <mesh ref={sombraBlob} rotation-x={-Math.PI / 2} visible={false}>
        <circleGeometry args={[0.5, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <primitive object={mira} />
    </>
  );
}

useGLTF.preload(MODELOS.mujer, false, true);
useGLTF.preload(MODELOS.barba, false, true);
useGLTF.preload(MODELOS.corto, false, true);
