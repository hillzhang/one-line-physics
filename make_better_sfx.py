import wave
import struct
import math

SAMPLE_RATE = 44100

def generate_sound(filename, func, duration):
    num_samples = int(SAMPLE_RATE * duration)
    audio_data = bytearray()
    for i in range(num_samples):
        t = float(i) / SAMPLE_RATE
        val = func(t)
        # Soft clipping
        val = max(-0.95, min(0.95, val))
        sample = int(val * 32767)
        audio_data.extend(struct.pack('<h', sample))
        
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        f.writeframes(audio_data)

# 1. Click: Marimba-like plonk
def click_func(t):
    # Fast attack, moderate decay
    freq1 = 800
    freq2 = 1600 # harmonic
    
    decay1 = math.exp(-30 * t)
    decay2 = math.exp(-50 * t)
    
    wave1 = math.sin(2 * math.pi * freq1 * t) * decay1
    wave2 = math.sin(2 * math.pi * freq2 * t) * decay2 * 0.5
    
    return (wave1 + wave2) * 0.8

generate_sound('assets/click.wav', click_func, 0.15)

# 2. Clear: Magical bell/chime (C Major Arpeggio)
def clear_func(t):
    # Frequencies: C5(523.25), E5(659.25), G5(783.99), C6(1046.50)
    
    def bell(freq, start_time):
        if t < start_time: return 0
        local_t = t - start_time
        attack = 0.005
        if local_t < attack:
            env = local_t / attack
        else:
            env = math.exp(-8 * (local_t - attack))
        
        # Bell timber
        w1 = math.sin(2 * math.pi * freq * local_t)
        w2 = math.sin(2 * math.pi * freq * 2.0 * local_t) * 0.4
        w3 = math.sin(2 * math.pi * freq * 3.0 * local_t) * 0.2
        return (w1 + w2 + w3) * env

    c1 = bell(523.25, 0.0)
    c2 = bell(659.25, 0.03)
    c3 = bell(783.99, 0.06)
    c4 = bell(1046.50, 0.09)
    
    return (c1 + c2 + c3 + c4) * 0.4

generate_sound('assets/clear.wav', clear_func, 0.6)
print("Generated musical SFX successfully!")
