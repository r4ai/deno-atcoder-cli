N, A, B = map(int, input().split())
C = map(int, input().split())

for i, c in enumerate(C):
    if c == A + B:
        print(i + 1)
